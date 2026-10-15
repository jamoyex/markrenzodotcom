import { readLead } from "../leads";
import {
  HttpError,
  jsonResponse,
  readJson,
  sameOrigin,
  visitorSession,
} from "./http";
import {
  deliverNotification,
  getNotificationStore,
  NotificationConflict,
  NotificationLimitError,
  type NotificationStore,
} from "./notifications";
import { trustedPreviewIp } from "./preview-service";

export function createLeadHandler(
  dependencies: {
    store?: () => NotificationStore;
    deliver?: typeof deliverNotification;
    trustedIpHeader?: () => string | undefined;
  } = {},
) {
  return async function POST(request: Request) {
    let session: ReturnType<typeof visitorSession> = null;
    try {
      sameOrigin(request);
      const body = await readJson(request, 16384);
      const lead = readLead(body.lead);
      if (!lead || body.confirmed !== true)
        throw new HttpError(
          400,
          "Please check your name, email and project details before sending.",
        );
      if (
        typeof body.requestId !== "string" ||
        !/^[a-zA-Z0-9_-]{16,80}$/.test(body.requestId)
      )
        throw new HttpError(400, "Please refresh and try again.");
      if (
        body.previewPrompt !== undefined &&
        (typeof body.previewPrompt !== "string" ||
          body.previewPrompt.length > 1200)
      )
        throw new HttpError(400, "Please shorten your preview idea.");
      session = visitorSession(request)!;
      const store = (dependencies.store || getNotificationStore)();
      const ipKey = trustedPreviewIp(
        request,
        (
          dependencies.trustedIpHeader ||
          (() => process.env.PREVIEW_TRUSTED_IP_HEADER)
        )(),
      );
      const notice = store.enqueue(
        session.id,
        body.requestId,
        {
          kind: "lead",
          lead,
          ...(body.previewPrompt
            ? { previewPrompt: body.previewPrompt as string }
            : {}),
        },
        ipKey,
      );
      // The brief is durably accepted before attempting delivery. No false claim
      // that Mark has read it; transient delivery failures remain in the outbox.
      await (dependencies.deliver || deliverNotification)(notice.id, {
        store,
      }).catch(() => {
        console.warn("portfolio_lead_notification_unavailable");
      });
      return jsonResponse(
        { accepted: true, id: notice.id },
        200,
        session.cookie,
      );
    } catch (error) {
      const status =
        error instanceof HttpError
          ? error.status
          : error instanceof NotificationLimitError
            ? 429
            : error instanceof NotificationConflict
              ? 409
              : 503;
      return jsonResponse(
        {
          error:
            error instanceof HttpError
              ? error.message
              : status === 429
                ? "You’ve sent a few ideas already. Please try again tomorrow."
                : status === 409
                  ? "These details changed after sending. Please start a new enquiry."
                  : "I couldn’t save your brief. Please try again shortly.",
        },
        status,
        session?.cookie,
      );
    }
  };
}
