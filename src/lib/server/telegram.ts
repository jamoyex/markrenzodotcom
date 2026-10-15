import { createHash, timingSafeEqual } from "node:crypto";
import {
  getStore,
  StoreLimitError,
  type OwnerReplyResult,
  type PortfolioStore,
} from "./store";

export type TelegramConfig = {
  botToken: string;
  ownerChatId: string;
  ownerUserId: string;
  webhookSecret?: string;
};

export type TelegramDependencies = {
  store?: PortfolioStore;
  config?: TelegramConfig | null;
  fetchImpl?: typeof fetch;
};

export type EscalationResult = {
  id?: string;
  status: "pending" | "processing" | "unavailable" | "limited" | "failed";
  reused?: boolean;
};

export type TelegramIgnoreReason =
  | "identity_mismatch"
  | "unsupported"
  | "nonreply"
  | "unrecognized_command"
  | "wrong_target";

export type TelegramUpdateResult = OwnerReplyResult & {
  reason?: TelegramIgnoreReason;
  shouldNotifyOwner?: boolean;
  feedback?: "sent" | "duplicate" | "failed";
};

export class TelegramServiceError extends Error {
  readonly status: number;

  constructor(
    status = 503,
    public readonly rejected = false,
  ) {
    // Never retain provider bodies, request URLs (which contain the token), or causes.
    super("Telegram is temporarily unavailable.");
    this.name = "TelegramServiceError";
    this.status = status;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numericId(value: unknown): string | null {
  return typeof value === "number" && Number.isSafeInteger(value)
    ? String(value)
    : null;
}

/** Pairing uses a private owner chat. No environment files are loaded by this module. */
export function getTelegramConfig(): TelegramConfig | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const ownerChatId = process.env.TELEGRAM_OWNER_CHAT_ID?.trim();
  const ownerUserId = process.env.TELEGRAM_OWNER_USER_ID?.trim();
  if (
    !botToken ||
    !/^\d+:[A-Za-z0-9_-]{20,}$/.test(botToken) ||
    !ownerChatId ||
    !/^[1-9]\d{0,15}$/.test(ownerChatId) ||
    !ownerUserId ||
    !/^[1-9]\d{0,15}$/.test(ownerUserId)
  )
    return null;
  return {
    botToken,
    ownerChatId,
    ownerUserId,
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET?.trim(),
  };
}

export function isTelegramConfigured(): boolean {
  return getTelegramConfig() !== null;
}

export function isValidWebhookSecret(
  provided: string | null,
  expected: string | undefined,
): boolean {
  if (
    !expected ||
    !/^[A-Za-z0-9_-]{16,256}$/.test(expected) ||
    !provided ||
    provided.length > 256
  )
    return false;
  // Equal-sized hashes keep the comparison constant-time even for unequal inputs.
  const incoming = createHash("sha256").update(provided).digest();
  const configured = createHash("sha256").update(expected).digest();
  return timingSafeEqual(incoming, configured);
}

/** Small allowlist used by the delivery helper and local polling worker. */
export async function callTelegram<T>(
  method: "sendMessage" | "getWebhookInfo" | "getUpdates",
  params: Record<string, unknown>,
  {
    config,
    fetchImpl = fetch,
    signal,
    timeoutMs = 12_000,
  }: {
    config: TelegramConfig;
    fetchImpl?: typeof fetch;
    signal?: AbortSignal;
    timeoutMs?: number;
  },
): Promise<T> {
  try {
    const timeout = AbortSignal.timeout(timeoutMs);
    const response = await fetchImpl(
      `https://api.telegram.org/bot${config.botToken}/${method}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
        cache: "no-store",
        redirect: "error",
      },
    );
    if (!response.ok)
      throw new TelegramServiceError(response.status, response.status < 500);
    const payload: unknown = await response.json();
    if (!isObject(payload) || payload.ok !== true || !("result" in payload)) {
      throw new TelegramServiceError(
        isObject(payload) && typeof payload.error_code === "number"
          ? payload.error_code
          : 503,
        isObject(payload) && payload.ok === false,
      );
    }
    return payload.result as T;
  } catch (error) {
    if (error instanceof TelegramServiceError) throw error;
    throw new TelegramServiceError();
  }
}

/** Sends one neutral question, with dedupe and quotas committed before network I/O. */
export async function escalateToTelegram(
  { sessionId, question }: { sessionId: string; question: string },
  dependencies: TelegramDependencies = {},
): Promise<EscalationResult> {
  const config =
    dependencies.config === undefined
      ? getTelegramConfig()
      : dependencies.config;
  if (!config) return { status: "unavailable" };
  const store = dependencies.store ?? getStore();
  let created: ReturnType<PortfolioStore["createHandoff"]>;
  try {
    created = store.createHandoff({ sessionId, question });
  } catch (error) {
    if (error instanceof StoreLimitError) return { status: "limited" };
    throw error;
  }
  const { handoff, reused } = created;
  if (reused)
    return {
      id: handoff.id,
      status: handoff.telegramMessageId === null ? "processing" : "pending",
      reused: true,
    };

  const text = [
    `Portfolio question · ${handoff.id.slice(0, 8)}`,
    "",
    handoff.question,
    "",
    "Reply to THIS message with a self-contained answer (not just “yes” or “no”).",
    "Your normal reply goes to the visitor AND is saved as a PUBLIC, owner-approved knowledge note. Do not include the visitor’s personal details or confidential information.",
    "Use /private before your answer to reply only to this visitor, without publishing. Use /skip to close the question without answering.",
    "This question expires after 7 days.",
  ].join("\n");
  try {
    const sent = await callTelegram<unknown>(
      "sendMessage",
      {
        chat_id: config.ownerChatId,
        text,
        link_preview_options: { is_disabled: true },
        reply_markup: {
          force_reply: true,
          input_field_placeholder: "Public answer, /private answer, or /skip",
        },
      },
      { config, fetchImpl: dependencies.fetchImpl },
    );
    if (
      !isObject(sent) ||
      typeof sent.message_id !== "number" ||
      !Number.isSafeInteger(sent.message_id) ||
      sent.message_id <= 0 ||
      !isObject(sent.chat) ||
      numericId(sent.chat.id) !== config.ownerChatId
    )
      throw new TelegramServiceError();
    if (!store.markHandoffSent(handoff.id, sent.message_id, config.ownerChatId))
      throw new TelegramServiceError();
    return { id: handoff.id, status: "pending", reused: false };
  } catch {
    // Do not retry sendMessage after an ambiguous network failure: it may have sent.
    store.markHandoffFailed(handoff.id);
    return { id: handoff.id, status: "failed" };
  }
}

/** Only a direct reply from the paired owner can answer or publish knowledge. */
export function processTelegramUpdate(
  update: unknown,
  dependencies: TelegramDependencies = {},
): TelegramUpdateResult {
  const config =
    dependencies.config === undefined
      ? getTelegramConfig()
      : dependencies.config;
  if (
    !config ||
    !isObject(update) ||
    typeof update.update_id !== "number" ||
    !Number.isSafeInteger(update.update_id) ||
    update.update_id < 0 ||
    !isObject(update.message)
  )
    return { status: "ignored", reason: "unsupported" };
  const message = update.message;
  if (
    !isObject(message.chat) ||
    message.chat.type !== "private" ||
    numericId(message.chat.id) !== config.ownerChatId ||
    !isObject(message.from) ||
    message.from.is_bot !== false ||
    numericId(message.from.id) !== config.ownerUserId
  )
    return { status: "ignored", reason: "identity_mismatch" };

  // Only the exact authenticated private owner can receive correction messages.
  // Media/captions are not interpreted as answers or transcribed implicitly.
  if (typeof message.text !== "string")
    return {
      status: "ignored",
      reason: "unsupported",
      shouldNotifyOwner: true,
    };
  let answer = message.text.trim();
  if (/^\/start(?:@[a-z\d_]+)?(?:\s|$)/i.test(answer))
    return { status: "ignored", reason: "unrecognized_command" };
  const skip = /^\/skip(?:@[a-z\d_]+)?(?:\s|$)/i.test(answer);
  const privateReply = /^\/private(?:@[a-z\d_]+)?(?:\s|$)/i.test(answer);
  if (privateReply)
    answer = answer.replace(/^\/private(?:@[a-z\d_]+)?(?:\s+|$)/i, "").trim();
  else if (!skip && answer.startsWith("/"))
    return {
      status: "ignored",
      reason: "unrecognized_command",
      shouldNotifyOwner: true,
    };
  if (!skip && (!answer || answer.length > 4_000))
    return {
      status: "ignored",
      reason: "unsupported",
      shouldNotifyOwner: true,
    };
  if (
    !isObject(message.reply_to_message) ||
    typeof message.reply_to_message.message_id !== "number" ||
    !Number.isSafeInteger(message.reply_to_message.message_id) ||
    message.reply_to_message.message_id <= 0
  )
    return { status: "ignored", reason: "nonreply", shouldNotifyOwner: true };
  const result = (dependencies.store ?? getStore()).applyOwnerReply({
    updateId: update.update_id,
    chatId: config.ownerChatId,
    replyToMessageId: message.reply_to_message.message_id,
    answer: skip ? undefined : answer,
    publish: !privateReply,
    skip,
  });
  return result.status === "ignored"
    ? { ...result, reason: "wrong_target", shouldNotifyOwner: true }
    : result;
}

/** Validate first, then send one private correction or receipt without quoting input. */
export async function handleTelegramUpdate(
  update: unknown,
  dependencies: TelegramDependencies = {},
): Promise<TelegramUpdateResult> {
  const config =
    dependencies.config === undefined
      ? getTelegramConfig()
      : dependencies.config;
  const result = processTelegramUpdate(update, { ...dependencies, config });
  const feedbackText =
    result.status === "answered"
      ? result.published
        ? "Answered the visitor and saved your reply as public knowledge."
        : "Answered the visitor privately. Nothing was added to public knowledge."
      : result.status === "skipped"
        ? "Question closed without publishing."
        : result.shouldNotifyOwner
          ? "Please use Reply on the Portfolio question message to attach your answer. Nothing was published. Send a text answer, /private followed by your answer, or /skip to decline. For an already answered or expired question, ask the visitor to send a new question."
          : undefined;
  if (
    !config ||
    !feedbackText ||
    !isObject(update) ||
    typeof update.update_id !== "number"
  )
    return result;
  const store = dependencies.store ?? getStore();
  if (!store.claimTelegramFeedback(update.update_id))
    return { ...result, feedback: "duplicate" };
  try {
    await callTelegram(
      "sendMessage",
      {
        chat_id: config.ownerChatId,
        text: feedbackText,
        link_preview_options: { is_disabled: true },
      },
      { config, fetchImpl: dependencies.fetchImpl },
    );
    return { ...result, feedback: "sent" };
  } catch {
    // Feedback is best-effort and at-most-once. A timeout may still have delivered.
    return { ...result, feedback: "failed" };
  }
}

async function readBoundedJson(request: Request): Promise<unknown> {
  const max = 64 * 1024;
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > max))
    throw new Error("Invalid update.");
  if (!request.body) throw new Error("Invalid update.");
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new Error("Invalid update.");
      }
      parts.push(value);
    }
    return JSON.parse(Buffer.concat(parts).toString("utf8")) as unknown;
  } finally {
    reader.releaseLock();
  }
}

/** The injectable handler keeps webhook tests entirely local. */
export async function handleTelegramWebhook(
  request: Request,
  dependencies: TelegramDependencies = {},
): Promise<Response> {
  const config =
    dependencies.config === undefined
      ? getTelegramConfig()
      : dependencies.config;
  const headers = { "Cache-Control": "no-store" };
  if (!config?.webhookSecret)
    return Response.json(
      { error: "Telegram webhook is not configured." },
      { status: 503, headers },
    );
  if (
    !isValidWebhookSecret(
      request.headers.get("x-telegram-bot-api-secret-token"),
      config.webhookSecret,
    )
  )
    return Response.json({ error: "Unauthorized." }, { status: 401, headers });
  let update: unknown;
  try {
    update = await readBoundedJson(request);
  } catch {
    return Response.json(
      { error: "Invalid update." },
      { status: 400, headers },
    );
  }
  try {
    await handleTelegramUpdate(update, { ...dependencies, config });
    return Response.json({ ok: true }, { headers });
  } catch {
    // Telegram can replay a transient failure; update dedupe and writes are atomic.
    return Response.json(
      { error: "Unable to process update." },
      { status: 503, headers },
    );
  }
}
