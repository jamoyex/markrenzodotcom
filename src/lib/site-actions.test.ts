import test from "node:test";
import assert from "node:assert/strict";
import { validateSiteAction } from "./site-actions";

test("browser actions reject arbitrary execution and unknown targets", () => {
  for (const value of [
    { type: "navigate", target: "https://example.com" },
    { type: "project", id: "courtfolio", script: "alert(1)" },
    { type: "preview", kind: "html", title: "app" },
    { type: "preview", kind: "website", title: "<script>" },
    { type: "celebrate", selector: "body" },
    null,
  ])
    assert.equal(validateSiteAction(value), false);
  assert.equal(validateSiteAction({ type: "project", id: "courtfolio" }), true);
  assert.equal(
    validateSiteAction({ type: "navigate", target: "experience" }),
    true,
  );
});
