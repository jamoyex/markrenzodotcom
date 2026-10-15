import test from "node:test";
import assert from "node:assert/strict";
import { readJson, visitorSession, sameOrigin } from "./http";

test("session stores a hash, uses httpOnly cookies and never accepts guessable IDs", () => {
  const session = visitorSession(
    new Request("http://127.0.0.1:3000/api/chat"),
  )!;
  assert.match(session.cookie!, /HttpOnly; SameSite=Lax/);
  const raw = session.cookie!.split(";")[0];
  assert.notEqual(session.id, raw.split("=")[1]);
  assert.equal(
    visitorSession(
      new Request("http://127.0.0.1:3000", { headers: { cookie: raw } }),
    )!.id,
    session.id,
  );
  assert.equal(
    visitorSession(
      new Request("http://127.0.0.1:3000", {
        headers: { cookie: "mr_portfolio_session=guess" },
      }),
      false,
    ),
    null,
  );
});

test("rejects cross-site mutations and oversized streams without a length header", async () => {
  assert.throws(() =>
    sameOrigin(
      new Request("http://127.0.0.1:3000/api/chat", {
        headers: { origin: "https://evil.example" },
      }),
    ),
  );
  const request = new Request("http://127.0.0.1:3000/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "x".repeat(9000) }),
  });
  await assert.rejects(readJson(request), /too long/);
});

test("accepts the actual Host when Next normalizes a loopback request URL", () => {
  assert.doesNotThrow(() =>
    sameOrigin(
      new Request("http://localhost:3000/api/chat", {
        headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
      }),
    ),
  );
  assert.throws(() =>
    sameOrigin(
      new Request("http://localhost:3000/api/chat", {
        headers: { host: "127.0.0.1:3000", origin: "https://evil.example" },
      }),
    ),
  );
});
