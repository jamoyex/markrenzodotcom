import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import { readLead } from "../leads";

// No env loading, remote DB driver or real transport. All handles are injected
// and opened only after creating a unique disposable OS temp directory.
async function fixture(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), "portfolio-notice-test-"));
  const { NotificationStore, deliverNotification } =
    await import("./notifications");
  let now = Date.UTC(2026, 9, 15);
  const store = new NotificationStore({ dataDir: dir, now: () => now });
  t.after(() => {
    store.close();
    assert.ok(dir.startsWith(join(tmpdir(), "portfolio-notice-test-")));
    rmSync(dir, { recursive: true, force: true });
  });
  return {
    store,
    dir,
    deliverNotification,
    advance(ms: number) {
      now += ms;
    },
  };
}
const lead = {
  name: "Test Visitor",
  email: "visitor@example.test",
  brief: "An appointment portal for a small repair studio.",
  budget: "Exploring",
  timeline: "Next quarter",
};
const config = {
  botToken: "test-only-token",
  ownerChatId: "12345",
  ownerUserId: "12345",
};
const request = (body: unknown, cookie = "a".repeat(64)) =>
  new Request("http://lead.test/api/leads", {
    method: "POST",
    headers: {
      origin: "http://lead.test",
      "content-type": "application/json",
      cookie: `mr_portfolio_session=${cookie}`,
    },
    body: JSON.stringify(body),
  });

test("lead validation requires supplied contact details and a bounded brief", () => {
  assert.deepEqual(readLead(lead), lead);
  assert.equal(readLead({ ...lead, email: "not-an-email" }), null);
  assert.equal(readLead({ ...lead, name: "" }), null);
  assert.equal(readLead({ ...lead, brief: "short" }), null);
  assert.equal(readLead({ ...lead, name: "Line\nbreak" }), null);
});

test("private outbox dedupes, binds payload, limits submissions and survives reopening", async (t) => {
  const f = await fixture(t);
  const { NotificationStore, NotificationConflict, NotificationLimitError } =
    await import("./notifications");
  const notice = { kind: "lead" as const, lead };
  const first = f.store.enqueue("session-a", "request-a", notice);
  const other = new NotificationStore({ dataDir: f.dir });
  try {
    assert.equal(other.enqueue("session-a", "request-a", notice).id, first.id);
    assert.throws(
      () =>
        other.enqueue("session-a", "request-a", {
          kind: "lead",
          lead: { ...lead, name: "Different" },
        }),
      NotificationConflict,
    );
    f.store.enqueue("session-a", "request-b", notice);
    f.store.enqueue("session-a", "request-c", notice);
    assert.throws(
      () => f.store.enqueue("session-a", "request-d", notice),
      NotificationLimitError,
    );
  } finally {
    other.close();
  }
});

test("one Telegram send under concurrent delivery; no force reply or knowledge publication", async (t) => {
  const f = await fixture(t);
  const item = f.store.enqueue("session-a", "request-a", {
    kind: "lead",
    lead,
    previewPrompt: "A small repair studio booking dashboard",
  });
  let sends = 0;
  const fetchImpl: typeof fetch = async (_url, options) => {
    sends++;
    const body = JSON.parse(options!.body as string);
    assert.equal(body.chat_id, config.ownerChatId);
    assert.match(body.text, /New project enquiry/);
    assert.match(body.text, /visitor@example.test/);
    assert.match(body.text, /Their preview idea/);
    assert.equal(body.reply_markup, undefined);
    assert.equal(body.parse_mode, undefined);
    return Response.json({
      ok: true,
      result: { message_id: 1, chat: { id: 12345 } },
    });
  };
  await Promise.all([
    f.deliverNotification(item.id, { store: f.store, config, fetchImpl }),
    f.deliverNotification(item.id, { store: f.store, config, fetchImpl }),
  ]);
  assert.equal(sends, 1);
  assert.equal(f.store.status(item.id), "sent");
});

test("unknown send outcome is never replayed; explicit throttling retries after backoff", async (t) => {
  const f = await fixture(t);
  const a = f.store.enqueue("a", "a", {
    kind: "build",
    prompt: "Example",
    previewId: "preview-a",
  });
  await f.deliverNotification(a.id, {
    store: f.store,
    config,
    fetchImpl: async () => {
      throw new Error("network failure");
    },
  });
  assert.equal(f.store.status(a.id), "uncertain");
  assert.equal(f.store.claim(a.id), undefined);
  const b = f.store.enqueue("a", "b", {
    kind: "build",
    prompt: "Example",
    previewId: "preview-b",
  });
  await f.deliverNotification(b.id, {
    store: f.store,
    config,
    fetchImpl: async () => Response.json({ ok: false }, { status: 429 }),
  });
  assert.equal(f.store.status(b.id), "pending");
  assert.equal(f.store.claim(b.id), undefined);
  f.advance(60001);
  assert.ok(f.store.claim(b.id));
  f.advance(60001);
  assert.equal(f.store.claim(b.id), undefined);
  assert.equal(f.store.status(b.id), "uncertain");
});

test("lead endpoint rejects cross-origin/unconfirmed requests and accepts only once", async (t) => {
  const f = await fixture(t);
  const { createLeadHandler } = await import("./lead-service");
  const oldSite = process.env.SITE_URL;
  process.env.SITE_URL = "http://lead.test";
  t.after(() => {
    if (oldSite === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = oldSite;
  });
  let sends = 0;
  const POST = createLeadHandler({
    store: () => f.store,
    trustedIpHeader: () => undefined,
    deliver: async (id) => {
      if (f.store.claim(id)) {
        sends++;
        f.store.finish(id!, "sent");
      }
    },
  });
  const body = { lead, confirmed: true, requestId: "lead_request_123456" };
  const cross = request(body);
  cross.headers.set("origin", "http://other.test");
  assert.equal((await POST(cross)).status, 403);
  assert.equal(
    (await POST(request({ ...body, confirmed: false }))).status,
    400,
  );
  assert.equal(sends, 0);
  assert.equal((await POST(request(body))).status, 200);
  assert.equal((await POST(request(body))).status, 200);
  assert.equal(sends, 1);
  assert.equal(
    (await POST(request({ ...body, lead: { ...lead, name: "Changed" } })))
      .status,
    409,
  );
  assert.equal(
    (await POST(request({ ...body, requestId: "lead_request_223456" }))).status,
    200,
  );
  assert.equal(
    (await POST(request({ ...body, requestId: "lead_request_323456" }))).status,
    200,
  );
  assert.equal(
    (await POST(request({ ...body, requestId: "lead_request_423456" }))).status,
    429,
  );
});
