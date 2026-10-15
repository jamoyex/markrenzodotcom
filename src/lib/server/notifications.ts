import { createHash, randomUUID } from "node:crypto";
import { chmodSync, mkdirSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { LeadDraft } from "../leads";
import {
  callTelegram,
  getTelegramConfig,
  TelegramServiceError,
  type TelegramConfig,
} from "./telegram";

type Notice =
  | { kind: "build"; prompt: string; previewId: string }
  | { kind: "lead"; lead: LeadDraft; previewPrompt?: string };
type Status = "pending" | "sending" | "sent" | "uncertain" | "failed";
type Row = {
  id: string;
  payload: string;
  status: Status;
  attempts: number;
  created_at: number;
};
export class NotificationLimitError extends Error {}
export class NotificationConflict extends Error {}

/** Separate private outbox. Never added to chat history or public knowledge. */
export class NotificationStore {
  private db: DatabaseSync;
  constructor(private options: { dataDir: string; now?: () => number }) {
    if (!isAbsolute(options.dataDir) || /[\0\r\n]/.test(options.dataDir))
      throw new Error("Invalid local data directory");
    mkdirSync(options.dataDir, { recursive: true, mode: 0o700 });
    const file = join(options.dataDir, "notifications.sqlite");
    this.db = new DatabaseSync(file);
    chmodSync(file, 0o600);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY, dedupe TEXT UNIQUE NOT NULL, session_id TEXT NOT NULL,
        kind TEXT NOT NULL, payload TEXT NOT NULL, fingerprint TEXT NOT NULL, ip_key TEXT,
        status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, next_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS notification_due ON notifications(status,next_at);`);
  }
  private now() {
    return this.options.now?.() ?? Date.now();
  }
  close() {
    this.db.close();
  }
  enqueue(
    sessionId: string,
    requestId: string,
    notice: Notice,
    ipKey?: string,
  ) {
    const now = this.now();
    const payload = JSON.stringify(notice);
    const dedupe = `${notice.kind}:${sessionId}:${requestId}`;
    const fingerprint = createHash("sha256").update(payload).digest("hex");
    this.db.exec("BEGIN IMMEDIATE");
    try {
      // Personal briefs expire after 30 days; retain no chat transcript or raw IP.
      this.db
        .prepare("DELETE FROM notifications WHERE created_at < ?")
        .run(now - 30 * 86400000);
      const existing = this.db
        .prepare(
          "SELECT id,status,fingerprint FROM notifications WHERE dedupe = ?",
        )
        .get(dedupe) as
        { id: string; status: Status; fingerprint: string } | undefined;
      if (existing) {
        if (existing.fingerprint !== fingerprint)
          throw new NotificationConflict();
        this.db.exec("COMMIT");
        return { id: existing.id, status: existing.status, created: false };
      }
      if (notice.kind === "lead") {
        const count = (sql: string, ...params: (string | number)[]) =>
          (this.db.prepare(sql).get(...params) as { n: number }).n;
        if (
          count(
            "SELECT count(*) n FROM notifications WHERE kind='lead' AND session_id=? AND created_at>?",
            sessionId,
            now - 86400000,
          ) >= 3 ||
          count(
            "SELECT count(*) n FROM notifications WHERE kind='lead' AND created_at>?",
            now - 3600000,
          ) >= 30 ||
          count(
            "SELECT count(*) n FROM notifications WHERE kind='lead' AND created_at>?",
            now - 86400000,
          ) >= 100 ||
          (ipKey &&
            count(
              "SELECT count(*) n FROM notifications WHERE kind='lead' AND ip_key=? AND created_at>?",
              ipKey,
              now - 86400000,
            ) >= 3)
        )
          throw new NotificationLimitError();
      }
      const id = randomUUID();
      this.db
        .prepare(
          "INSERT INTO notifications (id,dedupe,session_id,kind,payload,fingerprint,ip_key,created_at,updated_at,next_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
        )
        .run(
          id,
          dedupe,
          sessionId,
          notice.kind,
          payload,
          fingerprint,
          ipKey || null,
          now,
          now,
          now,
        );
      this.db.exec("COMMIT");
      return { id, status: "pending" as Status, created: true };
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  claim(id?: string): Row | undefined {
    const now = this.now();
    this.db.exec("BEGIN IMMEDIATE");
    try {
      // A crashed send may already have reached Telegram. Never blindly replay it.
      this.db
        .prepare(
          "UPDATE notifications SET status='uncertain' WHERE status='sending' AND updated_at < ?",
        )
        .run(now - 60000);
      const row = this.db
        .prepare(
          `SELECT id,payload,status,attempts,created_at FROM notifications WHERE status='pending' AND next_at<=? ${id ? "AND id=?" : ""} ORDER BY created_at LIMIT 1`,
        )
        .get(...(id ? [now, id] : [now])) as Row | undefined;
      if (row)
        this.db
          .prepare(
            "UPDATE notifications SET status='sending',attempts=attempts+1,updated_at=? WHERE id=?",
          )
          .run(now, row.id);
      this.db.exec("COMMIT");
      return row;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  finish(id: string, status: Status, retryIn = 0) {
    this.db
      .prepare(
        "UPDATE notifications SET status=?,updated_at=?,next_at=? WHERE id=? AND status='sending'",
      )
      .run(status, this.now(), this.now() + retryIn, id);
  }
  status(id: string): Status | undefined {
    return (
      this.db.prepare("SELECT status FROM notifications WHERE id=?").get(id) as
        { status: Status } | undefined
    )?.status;
  }
}
let defaultStore: NotificationStore | undefined;
export function getNotificationStore() {
  return (defaultStore ??= new NotificationStore({
    dataDir: process.env.PORTFOLIO_DATA_DIR || join(process.cwd(), ".data"),
  }));
}

export function notificationText(
  notice: Notice,
  id: string,
  createdAt: number,
): string {
  const clean = (value: string) =>
    value.replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, " ");
  const heading =
    notice.kind === "build"
      ? "🛠 New portfolio build"
      : "✉️ New project enquiry";
  const fields =
    notice.kind === "build"
      ? `Visitor’s idea:\n${clean(notice.prompt)}\n\nBuild: ${notice.previewId}\nGeneration has started.`
      : `Name: ${clean(notice.lead.name)}\nEmail: ${clean(notice.lead.email)}\n\nProject:\n${clean(notice.lead.brief)}\n\nBudget: ${clean(notice.lead.budget) || "Not specified"}\nTiming: ${clean(notice.lead.timeline) || "Not specified"}${notice.previewPrompt ? `\n\nTheir preview idea:\n${clean(notice.previewPrompt)}` : ""}`;
  return `${heading}\n${new Date(createdAt).toISOString()} · ${id.slice(0, 8)}\n\n${fields}\n\n${notice.kind === "lead" ? "Reply to the visitor using their email above." : "Anonymous visitor; no contact details collected yet."}`;
}

/** Explicit Telegram rejections may retry. Unknown delivery outcomes require review. */
export async function deliverNotification(
  id?: string,
  dependencies: {
    store?: NotificationStore;
    config?: TelegramConfig | null;
    fetchImpl?: typeof fetch;
  } = {},
) {
  const config =
    dependencies.config === undefined
      ? getTelegramConfig()
      : dependencies.config;
  if (!config) return;
  const store = dependencies.store || getNotificationStore();
  const row = store.claim(id);
  if (!row) return;
  try {
    const sent = await callTelegram<{
      message_id: number;
      chat: { id: number };
    }>(
      "sendMessage",
      {
        chat_id: config.ownerChatId,
        text: notificationText(
          JSON.parse(row.payload) as Notice,
          row.id,
          row.created_at,
        ),
        link_preview_options: { is_disabled: true },
      },
      { config, fetchImpl: dependencies.fetchImpl },
    );
    if (
      !Number.isSafeInteger(sent.message_id) ||
      String(sent.chat?.id) !== config.ownerChatId
    )
      throw new TelegramServiceError();
    store.finish(row.id, "sent");
  } catch (error) {
    const status =
      error instanceof TelegramServiceError && error.rejected
        ? error.status
        : undefined;
    const retry =
      (status === 429 || (status && status >= 500)) && row.attempts < 4;
    store.finish(
      row.id,
      retry ? "pending" : status ? "failed" : "uncertain",
      retry ? Math.min(3600000, 60000 * 2 ** row.attempts) : 0,
    );
    console.warn(
      "portfolio_notification_delivery",
      retry ? "retry_pending" : status ? "rejected" : "unconfirmed",
    );
  }
}
export async function notifyBuild(input: {
  sessionId: string;
  previewId: string;
  prompt: string;
}) {
  const result = getNotificationStore().enqueue(
    input.sessionId,
    input.previewId,
    { kind: "build", prompt: input.prompt, previewId: input.previewId },
  );
  await deliverNotification(result.id);
}
