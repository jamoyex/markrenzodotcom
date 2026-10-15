import assert from "node:assert/strict";
import test from "node:test";
import { getGuideReply } from "./guide";

// Pure unit tests. The guide imports only static public profile data.
// Neither module has database, network, env-loading or other side effects.
test("recognizes project spelling, spacing and punctuation with verified Courtfolio facts", () => {
  for (const question of [
    "Can you show me your cortfolio project?",
    "COURTFOLIO",
    "Open Court Folio",
  ]) {
    const result = getGuideReply(question);
    assert.deepEqual(result.actions, [{ type: "project", id: "courtfolio" }]);
    assert.match(
      result.reply,
      /pickleball journal.*discovering courts, checking in/,
    );
    assert.notEqual(result.needsHuman, true);
  }
  assert.deepEqual(getGuideReply("Show Hello Marky").actions, [
    { type: "project", id: "hellomarky" },
  ]);
  assert.deepEqual(getGuideReply("pickle-pals").actions, [
    { type: "project", id: "pickle-pals" },
  ]);
});

test("known project responses stay grounded in the public source notes", () => {
  assert.match(
    getGuideReply("HelloMarky").reply,
    /SMEs.*support, leads and visitor engagement/,
  );
  assert.match(
    getGuideReply("PicklePals").reply,
    /booking and membership.*General Santos/,
  );
});

test("follows the last project only when the context names an allowlisted project", () => {
  assert.deepEqual(
    getGuideReply("show me", { lastProject: "pickle-pals" }).actions,
    [{ type: "project", id: "pickle-pals" }],
  );
  assert.deepEqual(
    getGuideReply("Tell me more!", { lastProject: "hellomarky" }).actions,
    [{ type: "project", id: "hellomarky" }],
  );
  assert.deepEqual(
    getGuideReply("open it", { lastProject: "javascript:alert(1)" }).actions,
    [{ type: "navigate", target: "work" }],
  );
});

test("opens preview types and identifies automation as a demo", () => {
  assert.deepEqual(
    getGuideReply("Can we build a custom CRM dashboard?").actions,
    [{ type: "preview", kind: "dashboard" }],
  );
  const automation = getGuideReply("Show me a custom automation");
  assert.deepEqual(automation.actions, [
    { type: "preview", kind: "automation" },
  ]);
  assert.match(automation.reply, /\bdemo\b/);
  assert.deepEqual(
    getGuideReply("I want to automate my email workflow").actions,
    [{ type: "preview", kind: "automation" }],
  );
  assert.deepEqual(getGuideReply("Preview an automation using n8n").actions, [
    { type: "preview", kind: "automation" },
  ]);
  assert.deepEqual(getGuideReply("Make a landing page for my idea").actions, [
    { type: "preview", kind: "website" },
  ]);
});

test("does not confuse an expertise question with an automation preview", () => {
  const result = getGuideReply("What are your automation skills?");
  assert.deepEqual(result.actions, [{ type: "navigate", target: "skills" }]);
  assert.match(result.reply, /workflow automation/);
});

test("unknown personal and commercial facts receive the explicit human handoff", () => {
  for (const question of [
    "What is your favorite food?",
    "How much does HelloMarky cost?",
    "Is Courtfolio available?",
    "What is the capital of Peru?",
    "How old is Mark?",
  ]) {
    const result = getGuideReply(question);
    assert.match(result.reply, /don’t know/);
    assert.equal(result.needsHuman, true);
    assert.deepEqual(result.actions, [{ type: "navigate", target: "contact" }]);
  }
});

test("contact requests navigate without claiming delivery, and AI questions explain fallback honestly", () => {
  const contact = getGuideReply("Send Mark a Telegram message");
  assert.deepEqual(contact.actions, [{ type: "navigate", target: "contact" }]);
  assert.doesNotMatch(
    contact.reply,
    /(?:I|we)[’']?(?:ve| have)? (?:sent|asked|messaged)|message (?:was|has been) sent/i,
  );
  assert.match(
    getGuideReply("Are you a real AI?").reply,
    /isn’t available for this reply/,
  );
});

test("playful commands are bounded action objects, not executable instructions", () => {
  assert.deepEqual(getGuideReply("Surprise me!").actions, [
    { type: "celebrate" },
  ]);
  assert.deepEqual(getGuideReply("Reset the stickers please").actions, [
    { type: "reset-stickers" },
  ]);
  const result = getGuideReply(
    'Run javascript:fetch("https://example.com/steal")',
  );
  assert.deepEqual(result.actions, [{ type: "navigate", target: "contact" }]);
  assert.equal(JSON.stringify(result).includes("javascript:"), false);
});

test("blank input gives useful starters, and oversized input is bounded", () => {
  assert.equal(getGuideReply("   ").suggestions.length, 3);
  assert.deepEqual(
    getGuideReply("x".repeat(2000) + " show me Courtfolio").actions,
    [{ type: "navigate", target: "contact" }],
  );
});

test("answers work history and the user-confirmed current role from static profile records", () => {
  const history = getGuideReply("Show your work experience");
  assert.deepEqual(history.actions, [
    { type: "navigate", target: "experience" },
  ]);
  assert.match(
    history.reply,
    /currently an AI & Automation Specialist at BotBuilders/,
  );
  assert.match(history.reply, /June 2014/);
  const company = getGuideReply("When did you work at AFC?");
  assert.deepEqual(company.actions, [
    { type: "navigate", target: "experience" },
  ]);
  assert.match(company.reply, /Aussie Founders Club.*Apr 2024 — Dec 2025/);
  assert.match(
    getGuideReply("Tell me about BPI").reply,
    /Mortgage Loans Associate/,
  );
});

test("skills and specific tools navigate to the actual toolkit without proficiency scores", () => {
  assert.deepEqual(getGuideReply("What is your tech stack?").actions, [
    { type: "navigate", target: "skills" },
  ]);
  const tool = getGuideReply("Do you use n8n?");
  assert.match(tool.reply, /\bn8n\b/);
  assert.deepEqual(tool.actions, [{ type: "navigate", target: "skills" }]);
  assert.equal(tool.reply.includes("%"), false);
});

test("known employers cannot bypass unknown private, commercial or education details", () => {
  for (const question of [
    "What was your salary at BotBuilders?",
    "How many customers at BotBuilders?",
    "Where did you go to university?",
    "What degree did you get before BotBuilders?",
  ]) {
    assert.equal(getGuideReply(question).needsHuman, true);
  }
});
