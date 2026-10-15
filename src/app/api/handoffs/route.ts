import { getStore } from "@/lib/server/store";
import { jsonResponse, visitorSession } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const session = visitorSession(request, false);
  if (!session) return jsonResponse({ handoffs: [] });
  try {
    const handoffs = getStore()
      .listSessionHandoffs(session.id)
      .map((item) => ({
        id: item.id,
        status:
          item.status === "pending" && item.telegramMessageId === null
            ? "sending"
            : item.status,
        question: item.question,
        answer: item.answer || undefined,
      }));
    return jsonResponse({ handoffs });
  } catch {
    return jsonResponse({ error: "Replies are temporarily unavailable." }, 503);
  }
}
