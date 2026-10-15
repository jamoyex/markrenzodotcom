import type { LeadDraft } from "./leads";

export const CHAT_STORAGE_KEY = "mark-renzo:chats:v1";
export const WELCOME =
  "Hi! I’m Mark’s AI guide. Ask about his work, take a look around, or try out an idea. Where shall we start?";
export type ChatMessage = {
  id: number;
  role: "user" | "guide" | "mark";
  text: string;
  mode?: "ai" | "fallback";
  question?: string;
};
export type ChatHandoff = {
  id: string;
  status: "sending" | "pending" | "answered" | "skipped" | "failed" | "expired";
  question?: string;
  answer?: string;
};
export type ChatFailure = {
  question: string;
  requestId: string;
  error: string;
};
export type SavedChat = {
  id: string;
  updatedAt: number;
  messages: ChatMessage[];
  handoffs: ChatHandoff[];
  dismissed: string[];
  pollErrorsMuted: boolean;
  seenAnswers: string[];
  question: string;
  contactActive: boolean;
  leadDraft: LeadDraft | null;
  leadPreview?: string;
  leadRequestId: string | null;
  failedQuestion: ChatFailure | null;
};
export type ChatArchive = {
  version: 1;
  activeId: string;
  open: boolean;
  chats: SavedChat[];
};
export function validChatId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      value,
    )
  );
}
export function freshChat(id: string, now = Date.now()): SavedChat {
  return {
    id,
    updatedAt: now,
    messages: [{ id: 0, role: "guide", text: WELCOME }],
    handoffs: [],
    dismissed: [],
    pollErrorsMuted: false,
    seenAnswers: [],
    question: "",
    contactActive: false,
    leadDraft: null,
    leadRequestId: null,
    failedQuestion: null,
  };
}
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.slice(0, max) : "";
const ids = (value: unknown) =>
  Array.isArray(value)
    ? value
        .filter(
          (id): id is string => typeof id === "string" && id.length <= 200,
        )
        .slice(-40)
    : [];

/** Browser storage is untrusted. Only bounded presentation state is restored;
 * no site actions, URLs to execute, or requests run during restoration. */
export function readChatArchive(raw: string | null): ChatArchive | null {
  if (!raw || raw.length > 2_000_000) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (
      !record(data) ||
      data.version !== 1 ||
      !validChatId(data.activeId) ||
      !Array.isArray(data.chats)
    )
      return null;
    const chats: SavedChat[] = [];
    const unique = new Set<string>();
    for (const value of data.chats.slice(0, 12)) {
      if (!record(value) || !validChatId(value.id) || unique.has(value.id))
        continue;
      unique.add(value.id);
      const chat = freshChat(value.id);
      chat.updatedAt =
        typeof value.updatedAt === "number" &&
        Number.isFinite(value.updatedAt) &&
        Math.abs(value.updatedAt) <= 8.64e15
          ? value.updatedAt
          : Date.now();
      const messageIds = new Set<number>();
      chat.messages = Array.isArray(value.messages)
        ? value.messages.slice(-40).flatMap((m): ChatMessage[] => {
            if (
              !record(m) ||
              !Number.isSafeInteger(m.id) ||
              (m.id as number) < 0 ||
              messageIds.has(m.id as number) ||
              !["user", "guide", "mark"].includes(String(m.role)) ||
              typeof m.text !== "string"
            )
              return [];
            messageIds.add(m.id as number);
            return [
              {
                id: m.id as number,
                role: m.role as ChatMessage["role"],
                text: text(m.text, 6000),
                ...(m.mode === "ai" || m.mode === "fallback"
                  ? { mode: m.mode }
                  : {}),
                ...(typeof m.question === "string"
                  ? { question: text(m.question, 2000) }
                  : {}),
              },
            ];
          })
        : chat.messages;
      if (!chat.messages.length) chat.messages = freshChat(value.id).messages;
      chat.handoffs = Array.isArray(value.handoffs)
        ? value.handoffs.slice(-40).flatMap((h): ChatHandoff[] => {
            if (
              !record(h) ||
              typeof h.id !== "string" ||
              h.id.length > 200 ||
              ![
                "sending",
                "pending",
                "answered",
                "skipped",
                "failed",
                "expired",
              ].includes(String(h.status))
            )
              return [];
            return [
              {
                id: h.id,
                status: h.status as ChatHandoff["status"],
                question: text(h.question, 2000),
                answer: text(h.answer, 6000),
              },
            ];
          })
        : [];
      chat.dismissed = ids(value.dismissed);
      chat.pollErrorsMuted = value.pollErrorsMuted === true;
      chat.seenAnswers = ids(value.seenAnswers);
      chat.question = text(value.question, 2000);
      chat.contactActive = value.contactActive === true;
      if (record(value.leadDraft))
        chat.leadDraft = {
          name: text(value.leadDraft.name, 100),
          email: text(value.leadDraft.email, 254),
          brief: text(value.leadDraft.brief, 1200),
          budget: text(value.leadDraft.budget, 120),
          timeline: text(value.leadDraft.timeline, 120),
        };
      chat.leadPreview = text(value.leadPreview, 1200) || undefined;
      chat.leadRequestId = validChatId(value.leadRequestId)
        ? value.leadRequestId
        : null;
      if (
        record(value.failedQuestion) &&
        validChatId(value.failedQuestion.requestId) &&
        typeof value.failedQuestion.question === "string"
      )
        chat.failedQuestion = {
          requestId: value.failedQuestion.requestId,
          question: text(value.failedQuestion.question, 2000),
          error: "That reply was interrupted. You can retry your question.",
        };
      chats.push(chat);
    }
    if (!chats.some((chat) => chat.id === data.activeId)) return null;
    return {
      version: 1,
      activeId: data.activeId,
      open: data.open === true,
      chats,
    };
  } catch {
    return null;
  }
}
export function saveChat(
  archive: ChatArchive,
  chat: SavedChat,
  open: boolean,
): ChatArchive {
  let chats = [
    chat,
    ...archive.chats.filter((item) => item.id !== chat.id),
  ].slice(0, 12);
  let next: ChatArchive = { version: 1, activeId: chat.id, open, chats };
  while (JSON.stringify(next).length > 1_500_000 && chats.length > 1) {
    chats = chats.slice(0, -1);
    next = { ...next, chats };
  }
  return next;
}
export function chatTitle(chat: SavedChat) {
  return (
    chat.messages
      .find((message) => message.role === "user")
      ?.text.replace(/\s+/g, " ")
      .slice(0, 70) || "New conversation"
  );
}
export function chatPreview(chat: SavedChat) {
  return (
    chat.messages.at(-1)?.text || "Ask about a project, or share an idea."
  )
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*#_`]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}
