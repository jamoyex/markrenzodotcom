import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { chatScope } from "./chat-scope";
const a = "00000000-0000-4000-8000-000000000001";
const b = "00000000-0000-4000-8000-000000000002";
test("conversation scope is visitor-bound, stable and validates IDs", () => {
  assert.equal(chatScope("visitor", a), chatScope("visitor", a));
  assert.notEqual(chatScope("visitor", a), chatScope("visitor", b));
  assert.notEqual(chatScope("visitor", a), chatScope("other", a));
  assert.equal(chatScope("visitor", undefined), "visitor");
  for (const invalid of [null, {}, "../other", ""])
    assert.throws(() => chatScope("visitor", invalid));
});
test("fresh chat separates stored context and request replay in an isolated temporary SQLite database", async (t) => {
  // Never use getStore or environment configuration. Allocate before module import.
  const dataDir = mkdtempSync(join(tmpdir(), "portfolio-chat-test-"));
  const { createStore } = await import("./store");
  const store = createStore({ dataDir });
  t.after(() => {
    store.close();
    rmSync(dataDir, { recursive: true, force: true });
  });
  const first = chatScope("visitor", a),
    second = chatScope("visitor", b);
  store.appendExchange(
    first,
    "Tell me about PicklePals",
    "PicklePals is a club platform.",
  );
  assert.equal(store.getHistory(first).length, 2);
  assert.deepEqual(store.getHistory(second), []);
  assert.deepEqual(store.getHistory(chatScope("another-visitor", a)), []);
  assert.equal(store.beginRequest(first, "request-1").state, "new");
  store.completeRequest(first, "request-1", { reply: "Original reply" });
  assert.equal(store.beginRequest(first, "request-1").state, "complete");
  assert.equal(store.beginRequest(second, "request-1").state, "new");
});
