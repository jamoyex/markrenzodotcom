import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";

const HTML =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><style>body{font-family:system-ui}</style></head><body><h1>Sample task board</h1><button onclick="this.textContent=\'Done\'">Complete task</button><script>const demo = true;</script></body></html>';
const PROMPT = "Build a weekly task planner for a small design studio.";
const sessionA = "session_a_1234567890";
const sessionB = "session_b_1234567890";
const requestId = "request_1234567890";

// Isolation is established before module import or SQLite open. Every DB handle
// receives this exact new OS temp directory. No getPreviewStore(), env loader,
// remote DB driver, or live network calls are used by this file.
async function fixture(
  t: TestContext,
  limits?: { hourly: number; daily: number; ipDaily: number },
) {
  const dataDir = mkdtempSync(join(tmpdir(), "portfolio-preview-test-"));
  const { PreviewStore, PreviewLimitError, PreviewRequestConflict } =
    await import("./preview-store");
  let now = Date.UTC(2026, 9, 15, 12);
  let store = new PreviewStore({ dataDir, now: () => now, limits });
  const connections: InstanceType<typeof PreviewStore>[] = [];
  t.after(() => {
    for (const connection of connections) connection.close();
    store.close();
    assert.ok(dataDir.startsWith(join(tmpdir(), "portfolio-preview-test-")));
    rmSync(dataDir, { recursive: true, force: true });
  });
  return {
    get store() {
      return store;
    },
    PreviewLimitError,
    PreviewRequestConflict,
    advance(ms: number) {
      now += ms;
    },
    reopen() {
      store.close();
      store = new PreviewStore({ dataDir, now: () => now, limits });
    },
    connect() {
      const connection = new PreviewStore({ dataDir, now: () => now, limits });
      connections.push(connection);
      return connection;
    },
  };
}

test("reservation is durable, idempotent, and a different prompt cannot reuse its key", async (t) => {
  const f = await fixture(t);
  const first = f.store.reserve({
    sessionId: sessionA,
    requestId,
    prompt: PROMPT,
  });
  assert.equal(first.created, true);
  assert.equal(first.state.status, "generating");
  assert.equal(first.state.nextAllowedAt, "2026-10-16T12:00:00.000Z");
  f.reopen();
  const duplicate = f.store.reserve({
    sessionId: sessionA,
    requestId,
    prompt: PROMPT,
  });
  assert.equal(duplicate.id, first.id);
  assert.equal(duplicate.created, false);
  assert.throws(
    () =>
      f.store.reserve({
        sessionId: sessionA,
        requestId,
        prompt: "A completely different daily budget app",
      }),
    f.PreviewRequestConflict,
  );
  assert.throws(
    () =>
      f.store.reserve({
        sessionId: sessionA,
        requestId: "another_request_123",
        prompt: PROMPT,
      }),
    f.PreviewLimitError,
  );
});

test("two database connections share atomic session and global budgets", async (t) => {
  const f = await fixture(t, { hourly: 1, daily: 5, ipDaily: 3 });
  const other = f.connect();
  f.store.reserve({ sessionId: sessionA, requestId, prompt: PROMPT });
  assert.throws(
    () =>
      other.reserve({
        sessionId: sessionA,
        requestId: "other_request_123",
        prompt: PROMPT,
      }),
    f.PreviewLimitError,
  );
  assert.throws(
    () => other.reserve({ sessionId: sessionB, requestId, prompt: PROMPT }),
    f.PreviewLimitError,
  );
  assert.equal(other.getState(sessionB).status, "empty");
  f.advance(3_600_001);
  assert.equal(
    other.reserve({ sessionId: sessionB, requestId, prompt: PROMPT }).created,
    true,
  );
});

test("rolling daily global and trusted IP limits do not consume a rejected visitor allowance", async (t) => {
  const f = await fixture(t, { hourly: 20, daily: 2, ipDaily: 1 });
  const ipKey = "a".repeat(64);
  f.store.reserve({ sessionId: sessionA, requestId, prompt: PROMPT, ipKey });
  assert.throws(
    () =>
      f.store.reserve({
        sessionId: sessionB,
        requestId,
        prompt: PROMPT,
        ipKey,
      }),
    f.PreviewLimitError,
  );
  assert.equal(f.store.getState(sessionB).status, "empty");
  f.store.reserve({
    sessionId: sessionB,
    requestId,
    prompt: PROMPT,
    ipKey: "b".repeat(64),
  });
  assert.throws(
    () =>
      f.store.reserve({
        sessionId: "session_c_1234567890",
        requestId,
        prompt: PROMPT,
      }),
    f.PreviewLimitError,
  );
});

test("ready HTML is private, restored after reopening, and retained when a later build fails", async (t) => {
  const f = await fixture(t);
  const first = f.store.reserve({
    sessionId: sessionA,
    requestId,
    prompt: PROMPT,
  });
  assert.equal(f.store.complete(sessionA, first.id, HTML), true);
  assert.equal(f.store.getDocument(sessionB, first.id), null);
  f.reopen();
  assert.equal(f.store.getState(sessionA).preview?.html, HTML);
  assert.equal(f.store.getDocument(sessionA, first.id)?.prompt, PROMPT);
  f.advance(86_400_000);
  const later = f.store.reserve({
    sessionId: sessionA,
    requestId: "next_request_123456",
    prompt: "Build a custom inventory dashboard",
  });
  f.store.fail(sessionA, later.id);
  const state = f.store.getState(sessionA);
  assert.equal(state.status, "failed");
  assert.equal(state.preview?.id, first.id);
  assert.ok(state.nextAllowedAt);
  assert.throws(
    () =>
      f.store.reserve({
        sessionId: sessionA,
        requestId: "failed_retry_12345",
        prompt: PROMPT,
      }),
    f.PreviewLimitError,
  );
});

test("crashed generation expires without indefinite polling or a replacement charge", async (t) => {
  const f = await fixture(t);
  const pending = f.store.reserve({
    sessionId: sessionA,
    requestId,
    prompt: PROMPT,
  });
  f.advance(90_001);
  assert.equal(f.store.getState(sessionA).status, "failed");
  assert.equal(f.store.complete(sessionA, pending.id, HTML), false);
  assert.equal(
    f.store.reserve({ sessionId: sessionA, requestId, prompt: PROMPT }).created,
    false,
  );
  f.advance(7 * 86_400_000);
  assert.deepEqual(f.store.getState(sessionA), { status: "empty" });
});

test("successful later preview replaces the old document without losing replay protection", async (t) => {
  const f = await fixture(t);
  const first = f.store.reserve({
    sessionId: sessionA,
    requestId,
    prompt: PROMPT,
  });
  f.store.complete(sessionA, first.id, HTML);
  f.advance(86_400_000);
  const second = f.store.reserve({
    sessionId: sessionA,
    requestId: "next_request_123456",
    prompt: PROMPT,
  });
  f.store.complete(
    sessionA,
    second.id,
    HTML.replace("task board", "new task board"),
  );
  assert.equal(f.store.getDocument(sessionA, first.id), null);
  assert.equal(f.store.getState(sessionA).preview?.id, second.id);
  assert.equal(
    f.store.reserve({ sessionId: sessionA, requestId, prompt: PROMPT }).created,
    false,
  );
});

const apiResponse = (html: string) =>
  Response.json({
    status: "completed",
    output: [
      {
        type: "message",
        content: [{ type: "output_text", text: JSON.stringify({ html }) }],
      },
    ],
  });

test("generation uses only a bounded tool-free Responses request with structured HTML", async () => {
  const { generatePreview } = await import("./preview-generator");
  let calls = 0;
  const html = await generatePreview(PROMPT, {
    apiKey: "test-only-key",
    fetch: async (url, options) => {
      calls++;
      assert.equal(url, "https://api.openai.com/v1/responses");
      assert.equal(options?.redirect, "error");
      const body = JSON.parse(String(options?.body));
      assert.deepEqual(body.tools, []);
      assert.equal(body.tool_choice, "none");
      assert.equal(body.store, false);
      assert.equal(body.text.format.strict, true);
      assert.equal(body.max_output_tokens, 7000);
      assert.equal(body.input[0].content, PROMPT);
      return apiResponse(HTML);
    },
  });
  assert.equal(html, HTML);
  assert.equal(calls, 1);
});

test("generation retries one explicit transient failure but not invalid HTML or network ambiguity", async () => {
  const { generatePreview, PreviewGenerationError } =
    await import("./preview-generator");
  let calls = 0;
  assert.equal(
    await generatePreview(PROMPT, {
      apiKey: "test",
      fetch: async () =>
        ++calls === 1
          ? new Response("private upstream data", { status: 503 })
          : apiResponse(HTML),
    }),
    HTML,
  );
  assert.equal(calls, 2);
  calls = 0;
  await assert.rejects(
    generatePreview(PROMPT, {
      apiKey: "test",
      fetch: async () => {
        calls++;
        throw new Error("secret upstream body");
      },
    }),
    (error: unknown) =>
      error instanceof PreviewGenerationError &&
      error.code === "unavailable" &&
      !error.message.includes("secret"),
  );
  assert.equal(calls, 1);
  await assert.rejects(
    generatePreview(PROMPT, {
      apiKey: "test",
      fetch: async () => apiResponse("incomplete"),
    }),
    PreviewGenerationError,
  );
});

test("timeout, response size, incomplete result and refusal fail with controlled errors", async () => {
  const { generatePreview, PreviewGenerationError } =
    await import("./preview-generator");
  await assert.rejects(
    generatePreview(PROMPT, {
      apiKey: "test",
      timeoutMs: 5,
      fetch: async (_url, options) =>
        new Promise((_resolve, reject) =>
          options?.signal?.addEventListener("abort", () =>
            reject(new Error("aborted")),
          ),
        ),
    }),
    (error: unknown) =>
      error instanceof PreviewGenerationError && error.code === "timeout",
  );
  for (const response of [
    new Response("x".repeat(220_001)),
    Response.json({ status: "incomplete", output: [] }),
    Response.json({
      status: "completed",
      output: [
        { type: "message", content: [{ type: "refusal", refusal: "No" }] },
      ],
    }),
    Response.json({
      status: "completed",
      output: [{ type: "function_call", name: "anything" }],
    }),
  ]) {
    await assert.rejects(
      generatePreview(PROMPT, { apiKey: "test", fetch: async () => response }),
      PreviewGenerationError,
    );
  }
});

test("document quality gate rejects external assets, navigation, forms and known network code", async () => {
  const {
    validatePreviewHtml,
    PreviewGenerationError,
    previewDocumentResponse,
  } = await import("./preview-generator");
  for (const fragment of [
    '<a href="https://example.test">Leave</a>',
    '<form><input name="name"></form>',
    '<img src="https://example.test/pixel">',
    '<iframe srcdoc="anything"></iframe>',
    '<meta http-equiv="refresh" content="0;url=https://example.test">',
    '<script>fetch("https://example.test")</script>',
  ])
    assert.throws(
      () => validatePreviewHtml(HTML.replace("</body>", `${fragment}</body>`)),
      PreviewGenerationError,
    );
  const response = previewDocumentResponse(HTML);
  assert.match(
    response.headers.get("content-security-policy")!,
    /sandbox allow-scripts/,
  );
  assert.doesNotMatch(
    response.headers.get("content-security-policy")!,
    /allow-same-origin|allow-forms|allow-popups/,
  );
  assert.match(
    response.headers.get("content-security-policy")!,
    /connect-src 'none'/,
  );
  assert.match(
    response.headers.get("content-security-policy")!,
    /form-action 'none'/,
  );
  assert.equal(response.headers.get("cache-control"), "no-store, private");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
});

function req(
  method: "GET" | "POST",
  cookie?: string,
  body?: unknown,
  path = "/api/preview",
) {
  return new Request(`http://preview.test${path}`, {
    method,
    headers: {
      host: "preview.test",
      origin: "http://preview.test",
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

async function serviceFixture(t: TestContext) {
  const f = await fixture(t);
  const { createPreviewHandlers } = await import("./preview-service");
  const oldSite = process.env.SITE_URL;
  process.env.SITE_URL = "http://preview.test";
  t.after(() => {
    if (oldSite === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = oldSite;
  });
  let calls = 0;
  const handlers = createPreviewHandlers({
    store: () => f.store,
    apiKey: () => "test-only-key",
    trustedIpHeader: () => undefined,
    notify: async () => {},
    generate: async () => {
      calls++;
      return HTML;
    },
  });
  return {
    ...f,
    handlers,
    get calls() {
      return calls;
    },
    createPreviewHandlers,
  };
}

test("missing session is established before generation; reload and document access stay private", async (t) => {
  const f = await serviceFixture(t);
  const first = await f.handlers.POST(
    req("POST", undefined, { prompt: PROMPT, requestId }),
  );
  assert.equal(first.status, 428);
  assert.equal(f.calls, 0);
  const cookie = first.headers.get("set-cookie")!.split(";")[0];
  assert.match(first.headers.get("set-cookie")!, /HttpOnly/);
  const built = await f.handlers.POST(
    req("POST", cookie, { prompt: PROMPT, requestId }),
  );
  const state = await built.json();
  assert.equal(state.status, "ready");
  assert.equal(f.calls, 1);
  assert.deepEqual(
    await (await f.handlers.GET(req("GET", cookie))).json(),
    state,
  );
  assert.equal(
    (
      await f.handlers.DOCUMENT(
        req(
          "GET",
          cookie,
          undefined,
          `/api/preview/document?id=${state.preview.id}`,
        ),
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await f.handlers.DOCUMENT(
        req(
          "GET",
          "mr_portfolio_session=" + "f".repeat(64),
          undefined,
          `/api/preview/document?id=${state.preview.id}`,
        ),
      )
    ).status,
    404,
  );
  await f.handlers.POST(req("POST", cookie, { prompt: PROMPT, requestId }));
  assert.equal(f.calls, 1);
  const limited = await f.handlers.POST(
    req("POST", cookie, { prompt: PROMPT, requestId: "different_request_123" }),
  );
  assert.equal(limited.status, 429);
  const limitedState = await limited.json();
  assert.equal(limitedState.preview.id, state.preview.id);
  assert.equal(limitedState.nextAllowedAt, state.nextAllowedAt);
  assert.equal(f.calls, 1);
});

test("concurrent duplicate HTTP requests return generating without a second provider call", async (t) => {
  const f = await serviceFixture(t);
  let finish!: (html: string) => void;
  let started!: () => void;
  const entered = new Promise<void>((resolve) => {
    started = resolve;
  });
  const handlers = f.createPreviewHandlers({
    store: () => f.store,
    apiKey: () => "test",
    trustedIpHeader: () => undefined,
    notify: async () => {},
    generate: async () => {
      started();
      return new Promise<string>((resolve) => {
        finish = resolve;
      });
    },
  });
  const cookie = "mr_portfolio_session=" + "a".repeat(64);
  const first = handlers.POST(
    req("POST", cookie, { prompt: PROMPT, requestId }),
  );
  await entered;
  const duplicate = await handlers.POST(
    req("POST", cookie, { prompt: PROMPT, requestId }),
  );
  assert.equal(duplicate.status, 202);
  assert.equal((await duplicate.json()).status, "generating");
  finish(HTML);
  assert.equal((await (await first).json()).status, "ready");
});

test("invalid origin, prompt and unavailable provider do not spend a build", async (t) => {
  const f = await serviceFixture(t);
  const cookie = "mr_portfolio_session=" + "a".repeat(64);
  const crossOrigin = req("POST", cookie, { prompt: PROMPT, requestId });
  crossOrigin.headers.set("origin", "https://other.test");
  assert.equal((await f.handlers.POST(crossOrigin)).status, 403);
  assert.equal(
    (await f.handlers.POST(req("POST", cookie, { prompt: "short", requestId })))
      .status,
    400,
  );
  const unavailable = f.createPreviewHandlers({
    store: () => f.store,
    apiKey: () => undefined,
    trustedIpHeader: () => undefined,
    notify: async () => {},
    generate: async () => {
      throw new Error("must not call");
    },
  });
  assert.equal(
    (await unavailable.POST(req("POST", cookie, { prompt: PROMPT, requestId })))
      .status,
    503,
  );
  assert.equal(
    f.store.getState(createHash("sha256").update("a".repeat(64)).digest("hex"))
      .status,
    "empty",
  );
  assert.equal(f.calls, 0);
});

test("forwarded IP headers are ignored by default and configured headers fail closed", async () => {
  const { trustedPreviewIp } = await import("./preview-service");
  const request = req("GET");
  request.headers.set("x-forwarded-for", "198.51.100.10");
  assert.equal(trustedPreviewIp(request), undefined);
  assert.throws(() => trustedPreviewIp(request, "x-forwarded-for"));
  assert.throws(() => trustedPreviewIp(request, "x-real-ip"));
  request.headers.set("x-real-ip", "198.51.100.10");
  assert.match(trustedPreviewIp(request, "x-real-ip")!, /^[a-f0-9]{64}$/);
  request.headers.set("x-real-ip", "198.51.100.10, 203.0.113.3");
  assert.throws(() => trustedPreviewIp(request, "x-real-ip"));
});

test("only a newly accepted build notifies Mark, including a failed generation", async (t) => {
  const f = await serviceFixture(t);
  const calls: { prompt: string; previewId: string }[] = [];
  const handler = f.createPreviewHandlers({
    store: () => f.store,
    apiKey: () => "test",
    trustedIpHeader: () => undefined,
    notify: async (value) => {
      calls.push(value);
    },
    generate: async () => {
      throw new Error("simulated failure");
    },
  });
  const cookie = "mr_portfolio_session=" + "a".repeat(64);
  assert.equal(
    (await handler.POST(req("POST", cookie, { prompt: PROMPT, requestId })))
      .status,
    200,
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].prompt, PROMPT);
  await handler.POST(req("POST", cookie, { prompt: PROMPT, requestId }));
  assert.equal(calls.length, 1);
  assert.equal(
    (
      await handler.POST(
        req("POST", cookie, {
          prompt: PROMPT,
          requestId: "different_request_1234",
        }),
      )
    ).status,
    429,
  );
  assert.equal(calls.length, 1);
});
