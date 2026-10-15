import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE = "mr_portfolio_session";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function sameOrigin(request: Request): void {
  const configured = process.env.SITE_URL;
  // Next may normalize request.url to localhost even when the browser uses 127.0.0.1.
  // Host preserves the actual browser origin; production can pin SITE_URL explicitly.
  const url = new URL(request.url);
  const expected = configured
    ? new URL(configured).origin
    : `${url.protocol}//${request.headers.get("host") || url.host}`;
  if (
    request.headers.get("origin") !== expected ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new HttpError(403, "Please send your question from Mark’s website.");
  }
}

export async function readJson(
  request: Request,
  limit = 8192,
): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(
      415,
      "I couldn’t read that question. Please refresh the page and try again.",
    );
  if (Number(request.headers.get("content-length")) > limit)
    throw new HttpError(
      413,
      "That question is too long. Please shorten it and try again.",
    );
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Please enter a question.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > limit) {
        await reader.cancel();
        throw new HttpError(
          413,
          "That question is too long. Please shorten it and try again.",
        );
      }
      chunks.push(value);
    }
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error("invalid");
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(
      400,
      "I couldn’t read that question. Please refresh the page and try again.",
    );
  } finally {
    reader.releaseLock();
  }
}

/** The client keeps the opaque token; only its hash is used as a storage key. */
export function visitorSession(
  request: Request,
  create = true,
): { id: string; cookie?: string } | null {
  const raw = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  if (raw && /^[a-f0-9]{64}$/.test(raw))
    return { id: createHash("sha256").update(raw).digest("hex") };
  if (!create) return null;
  const token = randomBytes(32).toString("hex");
  const secure =
    new URL(process.env.SITE_URL || request.url).protocol === "https:";
  return {
    id: createHash("sha256").update(token).digest("hex"),
    cookie: `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure ? "; Secure" : ""}`,
  };
}

export function jsonResponse(
  data: unknown,
  status = 200,
  cookie?: string,
): Response {
  const headers = new Headers({
    "Cache-Control": "no-store, private",
    "X-Content-Type-Options": "nosniff",
  });
  if (cookie) headers.set("Set-Cookie", cookie);
  return Response.json(data, { status, headers });
}
