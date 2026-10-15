import { createHash } from "node:crypto";
import { notifyBuild } from "./notifications";
import { isIP } from "node:net";
import {
  HttpError,
  jsonResponse,
  readJson,
  sameOrigin,
  visitorSession,
} from "./http";
import {
  generatePreview,
  PreviewGenerationError,
  previewDocumentResponse,
} from "./preview-generator";
import {
  getPreviewStore,
  PreviewLimitError,
  PreviewRequestConflict,
  type PreviewStore,
} from "./preview-store";

type Dependencies = {
  store?: () => PreviewStore;
  apiKey?: () => string | undefined;
  model?: () => string | undefined;
  trustedIpHeader?: () => string | undefined;
  generate?: typeof generatePreview;
  notify?: typeof notifyBuild;
};

/** Configure only behind a proxy that replaces this header and blocks direct origin access. */
export function trustedPreviewIp(
  request: Request,
  header?: string,
): string | undefined {
  if (!header) return undefined;
  if (header !== "cf-connecting-ip" && header !== "x-real-ip")
    throw new HttpError(503, "The preview builder is unavailable right now.");
  const ip = request.headers.get(header)?.trim();
  if (!ip || !isIP(ip))
    throw new HttpError(503, "The preview builder is unavailable right now.");
  return createHash("sha256")
    .update(`portfolio-preview-ip:${ip}`)
    .digest("hex");
}

/** Dependency injection keeps HTTP tests on their explicitly selected temporary store. */
export function createPreviewHandlers(dependencies: Dependencies = {}) {
  const store = dependencies.store || getPreviewStore;
  const key = dependencies.apiKey || (() => process.env.OPENAI_API_KEY);
  const model =
    dependencies.model ||
    (() => process.env.OPENAI_PREVIEW_MODEL || process.env.OPENAI_MODEL);
  const ipHeader =
    dependencies.trustedIpHeader ||
    (() => process.env.PREVIEW_TRUSTED_IP_HEADER);
  const generate = dependencies.generate || generatePreview;
  const notify = dependencies.notify || notifyBuild;

  async function GET(request: Request): Promise<Response> {
    const session = visitorSession(request)!;
    try {
      return jsonResponse(store().getState(session.id), 200, session.cookie);
    } catch {
      return jsonResponse(
        {
          status: "empty",
          error:
            "Your saved preview is unavailable right now. Please try again shortly.",
        },
        503,
        session.cookie,
      );
    }
  }

  async function POST(request: Request): Promise<Response> {
    let session: ReturnType<typeof visitorSession> = null;
    let reservation: string | undefined;
    let selectedStore: PreviewStore | undefined;
    try {
      sameOrigin(request);
      session = visitorSession(request, false);
      if (!session) {
        session = visitorSession(request)!;
        return jsonResponse(
          {
            status: "empty",
            error: "Your session is ready. Please try your idea again.",
          },
          428,
          session.cookie,
        );
      }
      const body = await readJson(request, 8_192);
      if (
        typeof body.prompt !== "string" ||
        body.prompt.trim().length < 10 ||
        body.prompt.length > 1_200
      )
        throw new HttpError(
          400,
          "Describe your idea in 10 to 1,200 characters.",
        );
      if (
        typeof body.requestId !== "string" ||
        !/^[a-zA-Z0-9_-]{16,80}$/.test(body.requestId)
      )
        throw new HttpError(
          400,
          "Please refresh the page and try your idea again.",
        );
      const apiKey = key();
      if (!apiKey)
        throw new HttpError(
          503,
          "The preview builder is unavailable right now. Please try again later.",
        );
      const ipKey = trustedPreviewIp(request, ipHeader());
      selectedStore = store();
      const attempt = selectedStore.reserve({
        sessionId: session.id,
        requestId: body.requestId,
        prompt: body.prompt,
        ipKey,
      });
      if (!attempt.created)
        return jsonResponse(
          attempt.state,
          attempt.state.status === "generating" ? 202 : 200,
        );
      reservation = attempt.id;
      // Run alongside generation, and await before returning so serverless runtimes
      // do not discard the send. Accepted reservations alone create notifications.
      const notification = notify({
        sessionId: session.id,
        previewId: attempt.id,
        prompt: body.prompt.trim(),
      }).catch(() => {
        console.warn("portfolio_build_notification_unavailable");
      });
      try {
        const html = await generate(body.prompt.trim(), {
          apiKey,
          model: model(),
        });
        selectedStore.complete(session.id, attempt.id, html);
      } catch (error) {
        selectedStore.fail(session.id, attempt.id);
        // Only controlled codes reach logs, never upstream bodies, prompts, HTML, or credentials.
        console.warn(
          "portfolio_preview_failed",
          error instanceof PreviewGenerationError ? error.code : "unexpected",
        );
      }
      await notification;
      return jsonResponse(selectedStore.getState(session.id));
    } catch (error) {
      if (reservation && selectedStore && session) {
        try {
          selectedStore.fail(session.id, reservation);
        } catch {}
      }
      let state = {
        status: "empty" as "empty" | "generating" | "ready" | "failed",
      };
      if (session && selectedStore) {
        try {
          state = selectedStore.getState(session.id);
        } catch {}
      }
      if (error instanceof PreviewLimitError)
        return jsonResponse(
          {
            ...state,
            nextAllowedAt: error.nextAllowedAt,
            error: error.message,
          },
          429,
          session?.cookie,
        );
      if (error instanceof PreviewRequestConflict)
        return jsonResponse(
          { ...state, error: error.message },
          409,
          session?.cookie,
        );
      return jsonResponse(
        {
          ...state,
          error:
            error instanceof HttpError
              ? error.message
              : "The preview builder is unavailable right now. Please try again later.",
        },
        error instanceof HttpError ? error.status : 503,
        session?.cookie,
      );
    }
  }

  async function DOCUMENT(request: Request): Promise<Response> {
    const session = visitorSession(request, false);
    const id = new URL(request.url).searchParams.get("id");
    if (!session || !id || !/^[a-f0-9-]{36}$/.test(id))
      return jsonResponse({ error: "Preview not found." }, 404);
    try {
      const preview = store().getDocument(session.id, id);
      if (!preview) return jsonResponse({ error: "Preview not found." }, 404);
      return previewDocumentResponse(preview.html);
    } catch {
      return jsonResponse({ error: "Preview unavailable." }, 503);
    }
  }

  return { GET, POST, DOCUMENT };
}
