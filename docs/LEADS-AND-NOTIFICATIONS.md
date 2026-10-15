# Private enquiries and build alerts

## Visitor flow

- “Let’s talk”, “Tell me your idea”, the preview contact CTA, and contact actions in the guide open the enquiry conversation. Project story contact links enter it via `/?enquire=1#contact`.
- The guide uses the configured OpenAI model (default `gpt-5.6-luna`) to collect a project brief, name and email. Budget and timing are optional. A preview idea is carried into the conversation and attached to the enquiry.
- `prepare_lead` only prepares an editable review. It has no sending capability. The visitor presses **Send to Mark** before the browser submits `/api/leads`.
- Visitors can add details directly, keep an unfinished draft while closing/reopening the guide, or leave without sending. Draft edits and the submission id live in the parent component so closing the drawer during delivery cannot create a second send.
- An unavailable model offers the direct-entry form. The existing guide request limits still apply.

## Owner notifications

Accepted `/api/preview` reservations create one Telegram build alert, containing the prompt, timestamp and build reference. Replayed request ids, rejected inputs and cooldown-limited requests do not create alerts. Alerts start alongside generation, including when generation subsequently fails. They do not consume another OpenAI request.

Confirmed enquiries are validated server-side, durably accepted, and delivered to the already paired Telegram owner. The alert contains name, email, brief, optional budget/timing and the associated preview idea. It uses plain text with link previews disabled. These notices are separate from factual `ask_mark` handoffs: no force-reply, no automatic publication, no lead details added to public knowledge. Reply to leads using their supplied email.

`notifications.sqlite` lives under `PORTFOLIO_DATA_DIR` (or local `.data`) with owner-only file permissions. It stores the private outbox, payload fingerprints, idempotency keys and delivery status. Records older than 30 days are pruned on new enqueue. Like the existing stores, it needs a persistent local volume in production; this change does not deploy the site.

Lead limits: 3 per visitor session per rolling day, 30 globally per hour and 100 globally per day. If `PREVIEW_TRUSTED_IP_HEADER` is configured behind a correctly managed proxy, enquiries also have a 3-per-IP daily limit. Raw IP addresses are never stored. Cookie clearing can evade the per-session limit, so global limits remain essential.

## Delivery operation

Requests attempt delivery immediately and await the bounded send. Run `npm run telegram:notifications` alongside the app to drain queued notices and retry explicit transient rejections. This outbound worker is independent of the incoming Telegram webhook/poller and never opens the knowledge or preview databases. Multiple workers cannot claim the same pending row simultaneously.

`pending` means queued or explicitly throttled. `sent` requires a Telegram message id in the paired chat. Explicit rejections can become `failed`; network timeouts, malformed acknowledgements, server errors with ambiguous outcomes, and a crash during sending become `uncertain`. Telegram has no idempotency token for `sendMessage`, so uncertain sends are not blindly retried. Review those private records before manually resending. Messages are identified by a short outbox id to aid reconciliation. Nothing in the visitor UI claims that Mark has read a brief.

## Validation — October 15, 2026

- TypeScript passed.
- 58 selected tests passed across agent, preview, notification and Telegram modules. Database handles used explicit fresh OS temporary directories; no .env loading or live network in tests. All transports and stores were injected.
- Verified idempotency, concurrent claiming, cooldown notification suppression, notification on accepted-but-failed generation, validation, confirmation/origin checks, contact mode tool isolation, optional details, and ambiguous-delivery handling.
- Live OpenAI prepared a valid enquiry using fabricated test identity/contact data, with no knowledge handoff.
- Two clearly labeled test notices were acknowledged by Telegram in the configured owner chat: one build alert, one enquiry. The verification used a separate temporary outbox, not existing visitor records.
- Frontend checked in the isolated no-backend harness with mocked responses: header CTA, project enquiry deep link, editable review, closing/reopening without losing edits, submission confirmation, and 390px mobile controls without horizontal overflow.
- Proof: `artifacts/project-qa/lead-review-desktop.png` and `lead-review-mobile.png`. These show fabricated QA details, not a real lead.
