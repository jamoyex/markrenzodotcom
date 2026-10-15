import { createHash } from "node:crypto";
import { validChatId } from "../chat-sessions";
import { HttpError } from "./http";

/** Session cookie remains the rate-limit/ownership boundary. Conversation IDs
 * separate model history and request replay; they can never select another visitor. */
export function chatScope(sessionId: string, conversationId: unknown): string {
  if (conversationId === undefined) return sessionId; // Previous clients remain compatible.
  if (!validChatId(conversationId))
    throw new HttpError(400, "Please start a new chat and try again.");
  return createHash("sha256")
    .update(`portfolio-chat:${sessionId}:${conversationId}`)
    .digest("hex");
}
