import { jsonResponse, visitorSession } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const session = visitorSession(request)!;
  return jsonResponse(
    {
      ai: Boolean(process.env.OPENAI_API_KEY),
    },
    200,
    session.cookie,
  );
}
