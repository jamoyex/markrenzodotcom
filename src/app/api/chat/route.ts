import { chatScope } from "@/lib/server/chat-scope";
import { randomUUID } from "node:crypto";
import { getGuideReply } from "@/lib/guide";
import { validateSiteAction } from "@/lib/site-actions";
import { getQuickReplies, normalizeGuideContext } from "@/lib/quick-replies";
import {
  runAgent,
  AgentApiError,
  DEFAULT_AGENT_MODEL,
} from "@/lib/server/agent";
import { getStore } from "@/lib/server/store";
import { escalateToTelegram, getTelegramConfig } from "@/lib/server/telegram";
import {
  HttpError,
  jsonResponse,
  readJson,
  sameOrigin,
  visitorSession,
} from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  let session: ReturnType<typeof visitorSession> = null;
  let requestId: string | undefined;
  let claimed = false;
  let conversationScope: string | undefined;
  try {
    sameOrigin(request);
    // Allow the bounded question plus UI brief when UTF-8 uses several bytes per character.
    const body = await readJson(request, 16384);
    if (
      typeof body.message !== "string" ||
      !body.message.trim() ||
      body.message.length > 2000
    )
      throw new HttpError(
        400,
        "Please enter a question up to 2,000 characters.",
      );
    if (
      body.requestId !== undefined &&
      (typeof body.requestId !== "string" ||
        !/^[a-zA-Z0-9_-]{16,80}$/.test(body.requestId))
    )
      throw new HttpError(400, "Please refresh the page and try again.");
    requestId =
      typeof body.requestId === "string" ? body.requestId : randomUUID();
    const message = body.message.trim();
    const context = normalizeGuideContext(body.context);
    session = visitorSession(request)!;
    conversationScope = chatScope(session.id, body.conversationId);
    const store = getStore();
    const previous = store.beginRequest(conversationScope, requestId);
    if (previous.state === "complete")
      return jsonResponse(previous.response, 200, session.cookie);
    if (previous.state === "processing")
      return jsonResponse(
        { error: "That question is still being answered. Try again shortly." },
        409,
        session.cookie,
      );
    claimed = true;
    if (
      !store.consumeLimit(`chat:session:${session.id}`, 8, 60000) ||
      !store.consumeLimit("chat:global:hour", 120, 3600000) ||
      !store.consumeLimit("chat:global:day", 600, 86400000)
    )
      throw new HttpError(
        429,
        "I’m taking a short breather. Please try again later.",
      );
    const history = store.getHistory(conversationScope).slice(-9);
    // Owner replies retain visitor ownership; attach only handoffs associated
    // with this conversation, never client-supplied answer text.
    if (Array.isArray(body.handoffIds)) {
      for (const id of body.handoffIds.slice(-3)) {
        if (typeof id !== "string" || id.length > 200) continue;
        const handoff = store.getHandoff(id, session.id);
        if (handoff?.status === "answered" && handoff.answer)
          history.unshift({
            role: "assistant",
            content: `Mark replied to “${handoff.question}”: ${handoff.answer}`,
          });
      }
    }
    let result;
    if (!process.env.OPENAI_API_KEY) {
      result = fallback(message);
    } else {
      try {
        const agent = await runAgent(
          {
            message,
            history,
            knowledge: store.getKnowledge(),
            telegramAvailable: Boolean(getTelegramConfig()),
            contactMode: body.contactMode === true,
            context,
          },
          {
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || DEFAULT_AGENT_MODEL,
          },
        );
        result = {
          reply: agent.reply,
          actions: agent.actions.filter(validateSiteAction).slice(0, 4),
          suggestions: agent.suggestions,
          lead: agent.lead,
          mode: "ai" as const,
          handoff: undefined as
            { id: string; status: string; question: string } | undefined,
        };
        if (agent.handoffQuestion) {
          const sent = await escalateToTelegram({
            sessionId: session.id,
            question: agent.handoffQuestion,
          });
          if (
            (sent.status === "pending" || sent.status === "processing") &&
            sent.id
          ) {
            result.handoff = {
              id: sent.id,
              status: sent.status === "processing" ? "sending" : "pending",
              question: agent.handoffQuestion,
            };
            result.reply =
              sent.status === "processing"
                ? "I’m passing your question to Mark. His reply will appear here."
                : "I’ve asked Mark. His reply will appear here.";
          } else {
            result.reply =
              sent.status === "limited"
                ? "I can’t ask Mark another question right now. You can still contact him directly."
                : sent.status === "failed"
                  ? "I couldn’t confirm that your question reached Mark. Please try again later or contact him directly."
                  : "I can’t reach Mark here right now. You can contact him directly.";
            result.suggestions = ["Contact Mark"];
          }
        }
      } catch (error) {
        // Log only a controlled code, never upstream bodies, prompts or credentials.
        console.warn(
          "portfolio_ai_unavailable",
          error instanceof AgentApiError ? error.code : "unexpected",
        );
        result = fallback(message);
      }
    }
    if (body.contactMode === true && result.mode === "fallback") {
      result.reply =
        "Let’s put your idea into a brief. Add your name, email and what you’d like to build below, then send it to Mark.";
      result.actions = [];
    }
    // Also contextualize local fallback and any handoff-status reply replacement.
    result.suggestions =
      body.contactMode === true
        ? result.mode === "fallback"
          ? []
          : result.suggestions
        : getQuickReplies({
            context,
            conversation: [
              ...history,
              { role: "user", content: message },
              { role: "assistant", content: result.reply },
            ],
            candidates: result.suggestions,
            focus: "conversation",
            actions: result.actions,
          });
    store.appendExchange(conversationScope, message, result.reply);
    store.completeRequest(conversationScope, requestId, result);
    return jsonResponse(result, 200, session.cookie);
  } catch (error) {
    if (claimed && conversationScope && requestId) {
      try {
        getStore().abandonRequest(conversationScope!, requestId);
      } catch {}
    }
    const status = error instanceof HttpError ? error.status : 503;
    return jsonResponse(
      {
        error:
          error instanceof HttpError
            ? error.message
            : "I couldn’t finish that reply. Please try again shortly.",
      },
      status,
      session?.cookie,
    );
  }
}

function fallback(message: string) {
  const local = getGuideReply(message);
  return {
    reply: local.needsHuman
      ? "I’m having trouble answering right now. Please try again shortly, or contact Mark directly."
      : local.reply,
    actions: local.actions.filter(validateSiteAction),
    suggestions: local.suggestions,
    mode: "fallback" as const,
  };
}
