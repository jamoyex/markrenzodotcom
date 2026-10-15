import { handleTelegramWebhook } from "@/lib/server/telegram";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleTelegramWebhook(request);
}
