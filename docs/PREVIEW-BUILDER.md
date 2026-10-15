# Prompt preview builder

The builder calls the OpenAI Responses API to generate one complete HTML document for the visitor's brief. It does not select a canned preview. The generated document can use inline CSS and JavaScript for local demo interactions. It has no model tools, browsing, execution environment, backend integrations, or access to the portfolio knowledge base.

## Visitor flow

A fresh visit shows only the prompt composer and suggestions. No empty canvas or idle loading animation is mounted. Submitting an eligible brief immediately retracts the editor into a read-only prompt summary and reveals the generation canvas. The GSAP sequence collapses the editor over 240 ms, introduces the summary after 60 ms, and lifts/fades the canvas over 280 ms after 120 ms. When needed, the same sequence brings the summary and canvas into view; manual scrolling interrupts that move. Reduced motion uses an immediate collapse and a 150 ms canvas fade.

The editor is inert and hidden from accessibility navigation while collapsed. Submission focuses the summary; rejection restores the draft and focuses the editable prompt or, when the allowance is locked, its visible error. Successful saved previews reopen with their own prompt summary. After the allowance expires, “Try a new idea” returns to the composer, and “View your saved preview” preserves access to the previous result. Pending restored builds use neutral wording when the current brief is unavailable. A previous successful preview is never labeled as the result of a newer failed attempt.

The UI keeps the existing server allowance and sandboxed document route. A debounced size observer refreshes scroll positions after the accordion, generated document, responsive layout or expanded preview changes size.

Frontend validation used the actual component in an isolated localhost harness with in-memory responses, no backend modules, no environment loading and no OpenAI calls. Checked prompt-only entry, suggestions, animated submission, completed and restored previews, pending/failed states with an older result, 429 rejection, dropped-connection recovery, next-day drafts across focus refresh, keyboard focus, 375 px wrapping and reduced motion. TypeScript validation passed. The harness is temporary and is not part of the public site.

## HTTP contract

- `GET /api/preview` establishes the existing opaque HttpOnly visitor cookie if needed and restores that session's state.
- `POST /api/preview` accepts `{ "prompt": "10–1,200 characters", "requestId": "client UUID" }`. Keep the request ID for network retries. Await the initial GET before enabling submission. A POST without a cookie returns 428 and establishes a session without spending a build; the client may then retry the same request once.
- Both return `{status: "empty" | "generating" | "ready" | "failed", preview?: {id, prompt, html, createdAt}, nextAllowedAt?: ISODate, error?: string}`. A duplicate pending request returns 202; completed duplicate requests do not call the provider again. A new request within the allowance returns 429 with the saved preview and the next allowed time.
- `GET /api/preview/document?id=...` serves only the requesting session's latest successful preview, with restrictive document response headers. A missing or different visitor session receives 404.

The frontend must render the document route in an iframe with `sandbox="allow-scripts"` and `referrerPolicy="no-referrer"`. Never use `dangerouslySetInnerHTML`, inject generated scripts into the host, add `allow-same-origin`, or treat model output as trusted application code. The JSON HTML field is content, not an instruction to execute it.

## Storage and allowance

`preview-store.ts` opens only a local `previews.sqlite` inside `PORTFOLIO_DATA_DIR`, or `.data/` by default. It is separate from the existing portfolio store. Importing it does not open a database or load environment files. Its directory must be a persistent local volume shared by the Node processes serving this app. It is not suitable for several replicas with independent local disks or an ephemeral/serverless filesystem.

Reservations use SQLite `BEGIN IMMEDIATE` and a unique `(session_id, request_id)` key. They consume one build per visitor session per rolling 24 hours before calling the provider. Limits are 8 reservations globally per rolling hour and 30 globally per rolling day. The latest successful HTML survives a later failed attempt. Old successful document bodies are discarded when replaced; reservation/idempotency records expire after seven days, matching the visitor cookie lifetime.

Failed generation keeps the daily reservation. One internal retry is permitted only after an explicit upstream HTTP 429 or 5xx response, within the same 52-second overall deadline. Network failures, timeouts, refusals, and invalid outputs are not automatically resubmitted. A crashed pending reservation becomes failed after 90 seconds, so the frontend cannot poll forever. This is a per-browser-session allowance, not proof of a person's identity: clearing cookies creates a new session. Global limits remain authoritative.

## Configuration

- Reuses `OPENAI_API_KEY`; it is never sent to the visitor or embedded in generated HTML.
- Uses `OPENAI_PREVIEW_MODEL`, then `OPENAI_MODEL`, then `gpt-5.6-luna` ([model reference](https://developers.openai.com/api/docs/models/gpt-5.6-luna)).
- `PREVIEW_TRUSTED_IP_HEADER` is unset by default. Optional values are exactly `cf-connecting-ip` or `x-real-ip`. Configure one only when a trusted reverse proxy overwrites the header and direct origin access is blocked. Arbitrary `X-Forwarded-For` values are never trusted. A configured missing/invalid header fails closed before reservation. The extra limit is 3 reservations per hashed IP per rolling day; raw IPs are not stored. These hashes are rate-limit identifiers, not a claim of irreversible anonymization.

Requests have a bounded JSON body, 1,200-character prompt, 7,000-token model output cap, 220 KB provider-response cap, and 120 KB final-document cap. Provider errors log only a controlled code. The provider request has `store: false`, `tools: []`, a strict `{html: string}` response schema, and a fixed HTTPS endpoint with redirects rejected.

## Browser isolation

The document's HTTP CSP includes `sandbox allow-scripts`, `default-src 'none'`, inline-only scripts/styles, `connect-src 'none'`, data/blob-only images, and no frames, workers, external fonts/media, objects, base URL, or form actions. The document remains an opaque origin even on direct visits. Permissions for camera, microphone, geolocation, payments, clipboard and other capabilities are disabled. Responses are private/no-store and have no referrer.

The host page must also set `frame-src 'self'` to constrain iframe navigation to the site's origin. Sandbox alone does not reliably prevent a child frame from navigating itself to another page; do not claim that an unsupported `navigate-to` directive solves this. The HTML quality gate rejects common navigation markup, forms, external asset attributes, and network APIs, but is deliberately not described as a security sanitizer. Browser policies provide the boundary. Avoid accepting messages from the generated frame as portfolio commands.

## Validation

`node --import tsx --test src/lib/server/preview.test.ts`

The test fixture creates an OS temporary directory before importing/opening the store, passes that exact path into every SQLite connection, and closes all handles before removing it. The service's store/key/generator dependencies and provider fetch are injected. No default store, dotenv loader, remote database, configured credentials, or live API request is used. The only SQL deletion is bounded retention cleanup inside the explicitly selected local fixture/store.

The tests cover persistent and cross-connection reservation limits, idempotency, previous-preview retention, stalled attempts, response bounds and refusal, session establishment, reload restoration, cross-session denial, concurrent HTTP duplicates, quota responses, and CSP. All 14 tests passed on 2026-10-15.

A separate live browser check generated a custom Sunday Stems flower-shop preview through the existing OpenAI account. The generated bouquet list and mood selector worked inside the sandbox. Reload restored the same document and its daily allowance; a second generation remained disabled. At a 375px viewport the generated document fit its 333px frame without horizontal overflow. Generation animation, mobile preview sizing, and the private document sandbox were also checked. This used one real build; the visitor's cooldown was preserved.

API reference: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
