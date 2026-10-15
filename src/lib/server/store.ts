import { createHash, randomUUID } from "node:crypto";
import { chmodSync, mkdirSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { canonicalKnowledgeQuestion } from "./knowledge-context";

const DAY = 24 * 60 * 60 * 1000;
const PRIVATE_RETENTION = 7 * DAY;
const TOMBSTONE_RETENTION = 7 * DAY;
const SEND_LEASE = 60_000;
const REQUEST_LEASE = 60_000;

export type KnowledgeEntry = {
  id: string;
  answer: string;
  question?: string;
  source: "telegram-owner";
  createdAt: string;
  verifiedAt: string;
};

export type HandoffStatus =
  "pending" | "answered" | "skipped" | "expired" | "failed";
export type Handoff = {
  id: string;
  sessionId: string;
  question: string;
  status: HandoffStatus;
  answer: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  telegramMessageId: number | null;
};
export type HistoryMessage = { role: "user" | "assistant"; content: string };
export type RequestState =
  { state: "new" | "processing" } | { state: "complete"; response: unknown };
export type OwnerReplyResult = {
  status: "answered" | "skipped" | "ignored" | "duplicate";
  handoffId?: string;
  published?: boolean;
};

type HandoffRow = {
  id: string;
  session_id: string;
  question: string;
  status: HandoffStatus;
  answer: string | null;
  published: number;
  created_at: number;
  updated_at: number;
  expires_at: number;
  telegram_message_id: number | null;
};

export class StoreLimitError extends Error {
  constructor() {
    super("The question limit has been reached. Please try again later.");
    this.name = "StoreLimitError";
  }
}

function boundedText(value: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new Error("Invalid input.");
  }
  return value.trim();
}

function timestamp(value: number): string {
  return new Date(value).toISOString();
}

function handoffFromRow(row: HandoffRow): Handoff {
  return {
    id: row.id,
    sessionId: row.session_id,
    question: row.question,
    status: row.status,
    answer: row.answer,
    published: row.published === 1,
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
    expiresAt: timestamp(row.expires_at),
    telegramMessageId: row.telegram_message_id,
  };
}

/** A local file store. No connection strings, environment loading, or network I/O. */
export class PortfolioStore {
  private readonly db: DatabaseSync;
  private readonly now: () => number;
  private lastPruned = 0;

  constructor({
    dataDir,
    now = Date.now,
  }: {
    dataDir: string;
    now?: () => number;
  }) {
    // Explicit absolute directories make test and production selection reviewable.
    if (!isAbsolute(dataDir) || /[\0\r\n]/.test(dataDir)) {
      throw new Error("A local absolute data directory is required.");
    }
    mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    const filename = join(dataDir, "portfolio.sqlite");
    this.db = new DatabaseSync(filename);
    this.now = now;
    chmodSync(filename, 0o600);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS handoffs (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        question TEXT NOT NULL,
        question_key TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending','answered','skipped','expired','failed')),
        answer TEXT,
        published INTEGER NOT NULL DEFAULT 0,
        telegram_message_id INTEGER,
        telegram_chat_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS handoffs_session ON handoffs(session_id, created_at);
      CREATE UNIQUE INDEX IF NOT EXISTS handoffs_pending_question
        ON handoffs(session_id, question_key) WHERE status = 'pending';
      CREATE UNIQUE INDEX IF NOT EXISTS handoffs_telegram_message
        ON handoffs(telegram_chat_id, telegram_message_id) WHERE telegram_message_id IS NOT NULL;
      CREATE TABLE IF NOT EXISTS knowledge (
        id TEXT PRIMARY KEY,
        answer TEXT NOT NULL,
        source TEXT NOT NULL CHECK(source = 'telegram-owner'),
        handoff_id TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL,
        verified_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS knowledge_context (
        knowledge_id TEXT PRIMARY KEY REFERENCES knowledge(id) ON DELETE CASCADE,
        question TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS telegram_updates (
        update_id INTEGER PRIMARY KEY,
        processed_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS telegram_feedback (
        update_id INTEGER PRIMARY KEY,
        claimed_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user','assistant')),
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS history_session ON history(session_id, id);
      CREATE TABLE IF NOT EXISTS limits (
        key TEXT NOT NULL,
        window_start INTEGER NOT NULL,
        window_ms INTEGER NOT NULL,
        count INTEGER NOT NULL,
        PRIMARY KEY(key, window_start, window_ms)
      );
      CREATE TABLE IF NOT EXISTS requests (
        session_id TEXT NOT NULL,
        request_id TEXT NOT NULL,
        state TEXT NOT NULL CHECK(state IN ('processing','complete')),
        response TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY(session_id, request_id)
      );
      CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS leases (name TEXT PRIMARY KEY, holder TEXT NOT NULL, expires_at INTEGER NOT NULL);
    `);
    this.transaction(() => this.backfillKnowledgeContexts());
  }

  close(): void {
    this.db.close();
  }

  private transaction<T>(operation: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = operation();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  private maintain(): void {
    const now = this.now();
    const shouldPrune = now - this.lastPruned >= 60 * 60 * 1000;
    this.transaction(() => {
      // Capture safe canonical context from previously published notes before
      // the linked private handoff reaches its normal deletion deadline.
      this.backfillKnowledgeContexts();
      // A process can crash between reserving a question and confirming sendMessage.
      // Such a reservation is never evidence of delivery and must not stay open.
      this.db
        .prepare(
          "UPDATE handoffs SET status = 'failed', updated_at = ? WHERE status = 'pending' AND telegram_message_id IS NULL AND created_at <= ?",
        )
        .run(now, now - SEND_LEASE);
      // Preserve only the identity and expiry state for one more week so returning
      // browsers can observe a terminal status. Erase the private payload and IDs.
      this.db
        .prepare(
          "UPDATE handoffs SET status = 'expired', question = '', question_key = '', answer = NULL, published = 0, telegram_message_id = NULL, telegram_chat_id = NULL, created_at = expires_at, updated_at = expires_at WHERE status != 'expired' AND expires_at <= ?",
        )
        .run(now);
      if (!shouldPrune) return;
      // Only these private, time-bounded local records expire. Public owner notes persist.
      this.db
        .prepare("DELETE FROM history WHERE created_at <= ?")
        .run(now - PRIVATE_RETENTION);
      this.db
        .prepare("DELETE FROM requests WHERE created_at <= ?")
        .run(now - PRIVATE_RETENTION);
      this.db
        .prepare("DELETE FROM handoffs WHERE expires_at <= ?")
        .run(now - TOMBSTONE_RETENTION);
      this.db
        .prepare("DELETE FROM telegram_updates WHERE processed_at <= ?")
        .run(now - PRIVATE_RETENTION);
      this.db
        .prepare("DELETE FROM telegram_feedback WHERE claimed_at <= ?")
        .run(now - PRIVATE_RETENTION);
      this.db
        .prepare("DELETE FROM limits WHERE window_start + window_ms <= ?")
        .run(now - DAY);
      this.db.prepare("DELETE FROM leases WHERE expires_at <= ?").run(now);
    });
    if (shouldPrune) this.lastPruned = now;
  }

  private readHandoff(id: string): Handoff | null {
    const row = this.db
      .prepare("SELECT * FROM handoffs WHERE id = ?")
      .get(id) as HandoffRow | undefined;
    return row ? handoffFromRow(row) : null;
  }

  createHandoff({
    sessionId,
    question,
  }: {
    sessionId: string;
    question: string;
  }): { handoff: Handoff; reused: boolean } {
    sessionId = boundedText(sessionId, 128);
    question = boundedText(question, 2_000);
    this.maintain();
    const now = this.now();
    const questionKey = createHash("sha256")
      .update(question.normalize("NFKC").toLowerCase().replace(/\s+/g, " "))
      .digest("hex");
    return this.transaction(() => {
      const duplicate = this.db
        .prepare(
          "SELECT * FROM handoffs WHERE session_id = ? AND question_key = ? AND status = 'pending'",
        )
        .get(sessionId, questionKey) as HandoffRow | undefined;
      if (duplicate)
        return { handoff: handoffFromRow(duplicate), reused: true };
      const open = this.db
        .prepare(
          "SELECT COUNT(*) AS count FROM handoffs WHERE session_id = ? AND status = 'pending'",
        )
        .get(sessionId) as { count: number };
      const sessionKey = `handoff:session:${sessionId}`;
      if (
        open.count >= 3 ||
        !this.limitAvailable(sessionKey, 3, DAY, now) ||
        !this.limitAvailable("handoff:global", 30, DAY, now)
      ) {
        throw new StoreLimitError();
      }
      this.incrementLimit(sessionKey, DAY, now);
      this.incrementLimit("handoff:global", DAY, now);
      const id = randomUUID();
      this.db
        .prepare(
          "INSERT INTO handoffs (id,session_id,question,question_key,status,created_at,updated_at,expires_at) VALUES (?,?,?,?,'pending',?,?,?)",
        )
        .run(
          id,
          sessionId,
          question,
          questionKey,
          now,
          now,
          now + PRIVATE_RETENTION,
        );
      return { handoff: this.readHandoff(id)!, reused: false };
    });
  }

  getHandoff(id: string, sessionId: string): Handoff | null {
    this.maintain();
    const row = this.db
      .prepare(
        "SELECT * FROM handoffs WHERE id = ? AND session_id = ? AND expires_at > ?",
      )
      .get(id, sessionId, this.now() - TOMBSTONE_RETENTION) as
      HandoffRow | undefined;
    return row ? handoffFromRow(row) : null;
  }

  listSessionHandoffs(sessionId: string): Handoff[] {
    this.maintain();
    // The daily cap permits at most 45 records in this 14-day retention period.
    // Include them all so a newer question cannot hide an older terminal state.
    const rows = this.db
      .prepare(
        "SELECT * FROM handoffs WHERE session_id = ? AND expires_at > ? ORDER BY created_at DESC, id DESC LIMIT 64",
      )
      .all(sessionId, this.now() - TOMBSTONE_RETENTION) as HandoffRow[];
    return rows.map(handoffFromRow);
  }

  markHandoffSent(id: string, messageId: number, chatId: string): boolean {
    if (
      !Number.isSafeInteger(messageId) ||
      messageId <= 0 ||
      !/^-?\d+$/.test(chatId)
    )
      throw new Error("Invalid delivery reference.");
    this.maintain();
    const result = this.db
      .prepare(
        "UPDATE handoffs SET telegram_message_id = ?, telegram_chat_id = ?, updated_at = ? WHERE id = ? AND status = 'pending' AND telegram_message_id IS NULL AND created_at > ?",
      )
      .run(messageId, chatId, this.now(), id, this.now() - SEND_LEASE);
    return result.changes === 1;
  }

  markHandoffFailed(id: string): void {
    this.db
      .prepare(
        "UPDATE handoffs SET status = 'failed', updated_at = ? WHERE id = ? AND status = 'pending' AND telegram_message_id IS NULL",
      )
      .run(this.now(), id);
  }

  /** At most one feedback attempt per authenticated owner update, across workers. */
  claimTelegramFeedback(updateId: number): boolean {
    if (!Number.isSafeInteger(updateId) || updateId < 0)
      throw new Error("Invalid update.");
    this.maintain();
    const claim = this.db
      .prepare(
        "INSERT OR IGNORE INTO telegram_feedback (update_id,claimed_at) VALUES (?,?)",
      )
      .run(updateId, this.now());
    return claim.changes === 1;
  }

  /** Called only after Telegram owner identity and webhook authentication pass. */
  applyOwnerReply(input: {
    updateId: number;
    chatId: string;
    replyToMessageId: number;
    answer?: string;
    publish: boolean;
    skip?: boolean;
  }): OwnerReplyResult {
    if (
      !Number.isSafeInteger(input.updateId) ||
      input.updateId < 0 ||
      !Number.isSafeInteger(input.replyToMessageId)
    )
      throw new Error("Invalid update.");
    const answer = input.skip ? null : boundedText(input.answer ?? "", 4_000);
    this.maintain();
    const now = this.now();
    return this.transaction(() => {
      if (
        this.db
          .prepare("SELECT 1 FROM telegram_updates WHERE update_id = ?")
          .get(input.updateId)
      )
        return { status: "duplicate" };
      this.db
        .prepare(
          "INSERT INTO telegram_updates (update_id,processed_at) VALUES (?,?)",
        )
        .run(input.updateId, now);
      const row = this.db
        .prepare(
          "SELECT * FROM handoffs WHERE telegram_chat_id = ? AND telegram_message_id = ? AND status = 'pending' AND expires_at > ?",
        )
        .get(input.chatId, input.replyToMessageId, now) as
        HandoffRow | undefined;
      if (!row) return { status: "ignored" };
      const published = !input.skip && input.publish;
      const status = input.skip ? "skipped" : "answered";
      this.db
        .prepare(
          "UPDATE handoffs SET status = ?, answer = ?, published = ?, updated_at = ? WHERE id = ?",
        )
        .run(status, answer, published ? 1 : 0, now, row.id);
      if (answer) {
        this.db
          .prepare(
            "INSERT INTO history (session_id,role,content,created_at) VALUES (?,'assistant',?,?)",
          )
          .run(row.session_id, `Mark replied: ${answer}`, now);
        this.db
          .prepare(
            "DELETE FROM history WHERE session_id = ? AND id NOT IN (SELECT id FROM history WHERE session_id = ? ORDER BY id DESC LIMIT 40)",
          )
          .run(row.session_id, row.session_id);
      }
      if (published && answer) {
        // Only fixed canonical topics may supply context, never free-form questions.
        const knowledgeId = randomUUID();
        this.db
          .prepare(
            "INSERT INTO knowledge (id,answer,source,handoff_id,created_at,verified_at) VALUES (?,?,'telegram-owner',?,?,?)",
          )
          .run(knowledgeId, answer, row.id, now, now);
        const question = canonicalKnowledgeQuestion(row.question);
        if (question) {
          this.db
            .prepare(
              "INSERT INTO knowledge_context (knowledge_id,question) VALUES (?,?)",
            )
            .run(knowledgeId, question);
        }
      }
      return { status, handoffId: row.id, published };
    });
  }

  getKnowledge(): KnowledgeEntry[] {
    this.transaction(() => this.backfillKnowledgeContexts());
    const rows = this.db
      .prepare(
        "SELECT k.id,k.answer,k.source,k.created_at,k.verified_at,c.question FROM knowledge k LEFT JOIN knowledge_context c ON c.knowledge_id = k.id ORDER BY k.verified_at DESC, k.rowid DESC LIMIT 200",
      )
      .all() as {
      id: string;
      answer: string;
      source: "telegram-owner";
      created_at: number;
      verified_at: number;
      question: string | null;
    }[];
    return rows.reverse().map((row) => ({
      id: row.id,
      answer: row.answer,
      ...(row.question ? { question: row.question } : {}),
      source: row.source,
      createdAt: timestamp(row.created_at),
      verifiedAt: timestamp(row.verified_at),
    }));
  }

  /** Must run in a transaction; never mutates the owner-approved answer itself. */
  private backfillKnowledgeContexts(): void {
    const candidates = this.db
      .prepare(
        "SELECT k.id,h.question FROM knowledge k JOIN handoffs h ON h.id = k.handoff_id LEFT JOIN knowledge_context c ON c.knowledge_id = k.id WHERE k.source = 'telegram-owner' AND h.status = 'answered' AND h.published = 1 AND c.knowledge_id IS NULL",
      )
      .all() as { id: string; question: string }[];
    const insert = this.db.prepare(
      "INSERT OR IGNORE INTO knowledge_context (knowledge_id,question) VALUES (?,?)",
    );
    for (const candidate of candidates) {
      const question = canonicalKnowledgeQuestion(candidate.question);
      if (question) insert.run(candidate.id, question);
    }
  }

  getHistory(sessionId: string): HistoryMessage[] {
    this.maintain();
    const rows = this.db
      .prepare(
        "SELECT role,content FROM history WHERE session_id = ? AND created_at > ? ORDER BY id DESC LIMIT 40",
      )
      .all(sessionId, this.now() - PRIVATE_RETENTION) as HistoryMessage[];
    return rows
      .reverse()
      .map((row) => ({ role: row.role, content: row.content }));
  }

  appendExchange(sessionId: string, user: string, assistant: string): void {
    sessionId = boundedText(sessionId, 128);
    user = boundedText(user, 4_000);
    assistant = boundedText(assistant, 16_000);
    this.maintain();
    this.transaction(() => {
      const insert = this.db.prepare(
        "INSERT INTO history (session_id,role,content,created_at) VALUES (?,?,?,?)",
      );
      const now = this.now();
      insert.run(sessionId, "user", user, now);
      insert.run(sessionId, "assistant", assistant, now);
      this.db
        .prepare(
          "DELETE FROM history WHERE session_id = ? AND id NOT IN (SELECT id FROM history WHERE session_id = ? ORDER BY id DESC LIMIT 40)",
        )
        .run(sessionId, sessionId);
    });
  }

  private limitAvailable(
    key: string,
    limit: number,
    windowMs: number,
    now: number,
  ): boolean {
    const start = Math.floor(now / windowMs) * windowMs;
    const row = this.db
      .prepare(
        "SELECT count FROM limits WHERE key = ? AND window_start = ? AND window_ms = ?",
      )
      .get(key, start, windowMs) as { count: number } | undefined;
    return !row || row.count < limit;
  }

  private incrementLimit(key: string, windowMs: number, now: number): void {
    const start = Math.floor(now / windowMs) * windowMs;
    this.db
      .prepare(
        "INSERT INTO limits (key,window_start,window_ms,count) VALUES (?,?,?,1) ON CONFLICT(key,window_start,window_ms) DO UPDATE SET count = count + 1",
      )
      .run(key, start, windowMs);
  }

  consumeLimit(key: string, limit: number, windowMs: number): boolean {
    key = boundedText(key, 256);
    if (
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      !Number.isSafeInteger(windowMs) ||
      windowMs < 1
    )
      throw new Error("Invalid limit.");
    this.maintain();
    return this.transaction(() => {
      const now = this.now();
      if (!this.limitAvailable(key, limit, windowMs, now)) return false;
      this.incrementLimit(key, windowMs, now);
      return true;
    });
  }

  beginRequest(sessionId: string, requestId: string): RequestState {
    sessionId = boundedText(sessionId, 128);
    requestId = boundedText(requestId, 128);
    this.maintain();
    return this.transaction(() => {
      const now = this.now();
      const row = this.db
        .prepare(
          "SELECT state,response,updated_at FROM requests WHERE session_id = ? AND request_id = ?",
        )
        .get(sessionId, requestId) as
        | {
            state: "processing" | "complete";
            response: string | null;
            updated_at: number;
          }
        | undefined;
      if (row?.state === "complete")
        return {
          state: "complete",
          response: JSON.parse(row.response!) as unknown,
        };
      if (row && now - row.updated_at < REQUEST_LEASE)
        return { state: "processing" };
      this.db
        .prepare(
          "INSERT INTO requests (session_id,request_id,state,created_at,updated_at) VALUES (?,?,'processing',?,?) ON CONFLICT(session_id,request_id) DO UPDATE SET state = 'processing', response = NULL, updated_at = excluded.updated_at",
        )
        .run(sessionId, requestId, now, now);
      return { state: "new" };
    });
  }

  completeRequest(
    sessionId: string,
    requestId: string,
    response: unknown,
  ): void {
    const serialized = JSON.stringify(response);
    if (typeof serialized !== "string" || serialized.length > 200_000)
      throw new Error("Invalid response.");
    this.db
      .prepare(
        "UPDATE requests SET state = 'complete', response = ?, updated_at = ? WHERE session_id = ? AND request_id = ? AND state = 'processing'",
      )
      .run(serialized, this.now(), sessionId, requestId);
  }

  abandonRequest(sessionId: string, requestId: string): void {
    this.db
      .prepare(
        "DELETE FROM requests WHERE session_id = ? AND request_id = ? AND state = 'processing'",
      )
      .run(sessionId, requestId);
  }

  getTelegramOffset(): number {
    const row = this.db
      .prepare("SELECT value FROM metadata WHERE key = 'telegram_offset'")
      .get() as { value: string } | undefined;
    return row ? Number(row.value) : 0;
  }

  setTelegramOffset(offset: number): void {
    if (!Number.isSafeInteger(offset) || offset < 0)
      throw new Error("Invalid offset.");
    this.db
      .prepare(
        "INSERT INTO metadata (key,value) VALUES ('telegram_offset',?) ON CONFLICT(key) DO UPDATE SET value = CAST(MAX(CAST(value AS INTEGER), CAST(excluded.value AS INTEGER)) AS TEXT)",
      )
      .run(String(offset));
  }

  acquireLease(name: string, holder: string, ttlMs: number): boolean {
    return this.transaction(() => {
      const now = this.now();
      const current = this.db
        .prepare("SELECT holder,expires_at FROM leases WHERE name = ?")
        .get(name) as { holder: string; expires_at: number } | undefined;
      if (current && current.expires_at > now && current.holder !== holder)
        return false;
      this.db
        .prepare(
          "INSERT INTO leases (name,holder,expires_at) VALUES (?,?,?) ON CONFLICT(name) DO UPDATE SET holder = excluded.holder, expires_at = excluded.expires_at",
        )
        .run(name, holder, now + ttlMs);
      return true;
    });
  }

  releaseLease(name: string, holder: string): void {
    this.db
      .prepare("DELETE FROM leases WHERE name = ? AND holder = ?")
      .run(name, holder);
  }
}

/** Tests must pass a freshly created temporary directory explicitly. */
export function createStore(options: {
  dataDir: string;
  now?: () => number;
}): PortfolioStore {
  return new PortfolioStore(options);
}

let defaultStore: PortfolioStore | undefined;

/** Importing this module never opens a database or loads an environment file. */
export function getStore(): PortfolioStore {
  if (!defaultStore) {
    const configured = process.env.PORTFOLIO_DATA_DIR;
    if (
      configured &&
      (!isAbsolute(configured) || /^[a-z][a-z\d+.-]*:/i.test(configured))
    )
      throw new Error("Only a local data directory is supported.");
    defaultStore = createStore({
      dataDir: configured || join(process.cwd(), ".data"),
    });
  }
  return defaultStore;
}
