import { createHash, randomUUID } from "node:crypto";
import { chmodSync, mkdirSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

export const PREVIEW_DAY = 86_400_000;
const RETENTION = 7 * PREVIEW_DAY;
const GENERATION_LEASE = 90_000;
export const PREVIEW_LIMITS = { hourly: 8, daily: 30, ipDaily: 3 };
export const PREVIEW_FAILURE =
  "Your preview couldn’t be finished this time. Your next build is available at the time shown.";

export type GeneratedPreview = {
  id: string;
  prompt: string;
  html: string;
  createdAt: string;
};
export type PreviewState = {
  status: "empty" | "generating" | "ready" | "failed";
  preview?: GeneratedPreview;
  nextAllowedAt?: string;
  error?: string;
};
type Attempt = {
  id: string;
  session_id: string;
  request_id: string;
  prompt: string;
  prompt_hash: string;
  html: string | null;
  status: "generating" | "ready" | "failed";
  created_at: number;
};

export class PreviewLimitError extends Error {
  constructor(public readonly nextAllowedAt: string) {
    super(
      "The preview limit has been reached. Please try again at the time shown.",
    );
    this.name = "PreviewLimitError";
  }
}
export class PreviewRequestConflict extends Error {
  constructor() {
    super("Please start a new request for this idea.");
    this.name = "PreviewRequestConflict";
  }
}

const iso = (time: number) => new Date(time).toISOString();
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
function validId(value: string) {
  return /^[a-zA-Z0-9_-]{16,100}$/.test(value);
}

/** Opens only an explicitly selected local directory. Imports have no side effects. */
export class PreviewStore {
  private readonly db: DatabaseSync;
  private readonly now: () => number;
  private readonly limits: typeof PREVIEW_LIMITS;

  constructor({
    dataDir,
    now = Date.now,
    limits = PREVIEW_LIMITS,
  }: {
    dataDir: string;
    now?: () => number;
    limits?: typeof PREVIEW_LIMITS;
  }) {
    if (!isAbsolute(dataDir) || /[\0\r\n]/.test(dataDir))
      throw new Error("A local absolute data directory is required.");
    if (
      Object.values(limits).some(
        (value) => !Number.isSafeInteger(value) || value < 1 || value > 1_000,
      )
    )
      throw new Error("Invalid preview limits.");
    mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    const filename = join(dataDir, "previews.sqlite");
    this.db = new DatabaseSync(filename);
    chmodSync(filename, 0o600);
    this.now = now;
    this.limits = limits;
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS preview_attempts (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        request_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        prompt_hash TEXT NOT NULL,
        html TEXT,
        status TEXT NOT NULL CHECK(status IN ('generating','ready','failed')),
        ip_key TEXT,
        created_at INTEGER NOT NULL,
        UNIQUE(session_id, request_id)
      );
      CREATE INDEX IF NOT EXISTS preview_session_time ON preview_attempts(session_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS preview_time ON preview_attempts(created_at);
      CREATE INDEX IF NOT EXISTS preview_ip_time ON preview_attempts(ip_key, created_at);
    `);
  }

  close() {
    this.db.close();
  }

  private prune() {
    const now = this.now();
    this.db
      .prepare(
        "UPDATE preview_attempts SET status = 'failed' WHERE status = 'generating' AND created_at <= ?",
      )
      .run(now - GENERATION_LEASE);
    this.db
      .prepare("DELETE FROM preview_attempts WHERE created_at < ?")
      .run(now - RETENTION);
  }

  getState(sessionId: string): PreviewState {
    this.prune();
    const latest = this.db
      .prepare(
        "SELECT * FROM preview_attempts WHERE session_id = ? ORDER BY created_at DESC LIMIT 1",
      )
      .get(sessionId) as Attempt | undefined;
    if (!latest) return { status: "empty" };
    const ready = this.db
      .prepare(
        "SELECT * FROM preview_attempts WHERE session_id = ? AND status = 'ready' AND html IS NOT NULL ORDER BY created_at DESC LIMIT 1",
      )
      .get(sessionId) as Attempt | undefined;
    return {
      status: latest.status,
      ...(ready
        ? {
            preview: {
              id: ready.id,
              prompt: ready.prompt,
              html: ready.html!,
              createdAt: iso(ready.created_at),
            },
          }
        : {}),
      ...(latest.created_at + PREVIEW_DAY > this.now()
        ? { nextAllowedAt: iso(latest.created_at + PREVIEW_DAY) }
        : {}),
      ...(latest.status === "failed" ? { error: PREVIEW_FAILURE } : {}),
    };
  }

  reserve({
    sessionId,
    requestId,
    prompt,
    ipKey,
  }: {
    sessionId: string;
    requestId: string;
    prompt: string;
    ipKey?: string;
  }): { created: boolean; id: string; state: PreviewState } {
    if (
      !validId(sessionId) ||
      !validId(requestId) ||
      (ipKey && !/^[a-f0-9]{64}$/.test(ipKey))
    )
      throw new Error("Invalid preview identifier.");
    if (!prompt.trim() || prompt.length > 1_200)
      throw new Error("Invalid preview prompt.");
    const text = prompt.trim();
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.prune();
      const previous = this.db
        .prepare(
          "SELECT * FROM preview_attempts WHERE session_id = ? AND request_id = ?",
        )
        .get(sessionId, requestId) as Attempt | undefined;
      if (previous) {
        if (previous.prompt_hash !== hash(text))
          throw new PreviewRequestConflict();
        const state = this.getState(sessionId);
        this.db.exec("COMMIT");
        return { created: false, id: previous.id, state };
      }
      const now = this.now();
      const session = this.db
        .prepare(
          "SELECT created_at FROM preview_attempts WHERE session_id = ? ORDER BY created_at DESC LIMIT 1",
        )
        .get(sessionId) as { created_at: number } | undefined;
      if (session && session.created_at + PREVIEW_DAY > now)
        throw new PreviewLimitError(iso(session.created_at + PREVIEW_DAY));
      for (const [window, limit] of [
        [3_600_000, this.limits.hourly],
        [PREVIEW_DAY, this.limits.daily],
      ]) {
        const rows = this.db
          .prepare(
            "SELECT created_at FROM preview_attempts WHERE created_at > ? ORDER BY created_at",
          )
          .all(now - window) as { created_at: number }[];
        if (rows.length >= limit)
          throw new PreviewLimitError(
            iso(rows[rows.length - limit].created_at + window),
          );
      }
      if (ipKey) {
        const rows = this.db
          .prepare(
            "SELECT created_at FROM preview_attempts WHERE ip_key = ? AND created_at > ? ORDER BY created_at",
          )
          .all(ipKey, now - PREVIEW_DAY) as { created_at: number }[];
        if (rows.length >= this.limits.ipDaily)
          throw new PreviewLimitError(
            iso(
              rows[rows.length - this.limits.ipDaily].created_at + PREVIEW_DAY,
            ),
          );
      }
      const id = randomUUID();
      this.db
        .prepare(
          "INSERT INTO preview_attempts(id,session_id,request_id,prompt,prompt_hash,status,ip_key,created_at) VALUES(?,?,?,?,?,'generating',?,?)",
        )
        .run(id, sessionId, requestId, text, hash(text), ipKey || null, now);
      const state = this.getState(sessionId);
      this.db.exec("COMMIT");
      return { created: true, id, state };
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  complete(sessionId: string, id: string, html: string): boolean {
    if (
      typeof html !== "string" ||
      html.length < 100 ||
      Buffer.byteLength(html) > 120_000
    )
      throw new Error("Invalid preview document.");
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.prune();
      const result = this.db
        .prepare(
          "UPDATE preview_attempts SET html = ?, status = 'ready' WHERE id = ? AND session_id = ? AND status = 'generating'",
        )
        .run(html, id, sessionId);
      if (result.changes) {
        // Keep only the newest successful document, while retaining quota/idempotency records.
        this.db
          .prepare(
            "UPDATE preview_attempts SET html = NULL, prompt = '' WHERE session_id = ? AND id != ? AND status = 'ready'",
          )
          .run(sessionId, id);
      }
      this.db.exec("COMMIT");
      return Boolean(result.changes);
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  fail(sessionId: string, id: string) {
    this.db
      .prepare(
        "UPDATE preview_attempts SET status = 'failed' WHERE id = ? AND session_id = ? AND status = 'generating'",
      )
      .run(id, sessionId);
  }

  getDocument(sessionId: string, id: string): GeneratedPreview | null {
    const preview = this.getState(sessionId).preview;
    return preview?.id === id ? preview : null;
  }
}

let defaultStore: PreviewStore | undefined;
export function getPreviewStore(): PreviewStore {
  if (!defaultStore) {
    const dataDir =
      process.env.PORTFOLIO_DATA_DIR || join(process.cwd(), ".data");
    defaultStore = new PreviewStore({ dataDir });
  }
  return defaultStore;
}
