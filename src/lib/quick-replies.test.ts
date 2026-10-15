import assert from "node:assert/strict";
import test from "node:test";
import { getQuickReplies, normalizeGuideContext } from "./quick-replies";

// These tests import only a synchronous helper with a type-only SiteAction import.
// No environment loaders, provider clients, database modules, or network calls.
test("normalizes only bounded, allowlisted UI context", () => {
  assert.deepEqual(normalizeGuideContext(null), {});
  assert.deepEqual(normalizeGuideContext([]), {});
  assert.deepEqual(
    normalizeGuideContext({
      section: "admin",
      project: "unknown",
      preview: { status: "approved" },
    }),
    {},
  );
  const context = normalizeGuideContext({
    section: "playground",
    project: "courtfolio",
    extra: "discard me",
    preview: {
      status: "ready",
      prompt: "a".repeat(1400),
      nextAllowedAt: "2099-01-01T08:00:00+08:00",
      html: "<script>unsafe()</script>",
    },
  });
  assert.deepEqual(Object.keys(context), ["section", "project", "preview"]);
  assert.equal(context.preview?.prompt?.length, 1200);
  assert.equal(context.preview?.nextAllowedAt, "2099-01-01T00:00:00.000Z");
  assert.deepEqual(Object.keys(context.preview!), [
    "status",
    "prompt",
    "nextAllowedAt",
  ]);
});

test("rejects rolled-over or malformed cooldown dates and strips prompt control characters", () => {
  for (const date of [
    "tomorrow",
    "2099-02-31T00:00:00Z",
    "2099-01-01T24:00:00Z",
    "2099-01-01T00:00:00+25:00",
  ]) {
    assert.deepEqual(
      normalizeGuideContext({
        preview: { status: "empty", nextAllowedAt: date },
      }),
      { preview: { status: "empty" } },
    );
  }
  assert.equal(
    normalizeGuideContext({
      preview: { status: "ready", prompt: "  Flower\u0000shop\n  " },
    }).preview?.prompt,
    "Flower shop",
  );
});

test("prefers useful current model candidates and filters repeated questions, actions, and unsafe chips", () => {
  const replies = getQuickReplies({
    focus: "conversation",
    context: { section: "work", project: "courtfolio" },
    conversation: [
      { role: "user", content: "What is Mark’s favourite food?" },
      { role: "user", content: "Open Courtfolio" },
      { role: "assistant", content: "Let’s take a look at Courtfolio." },
    ],
    actions: [{ type: "project", id: "courtfolio" }],
    candidates: [
      "Show me Courtfolio",
      "What’s Mark’s favorite food?",
      "Who is Courtfolio for?",
      "Who is Courtfolio for!",
      "<script>bad()</script>",
      "Visit https://example.com",
      "How could a court journal help me?",
    ],
  });
  assert.equal(replies.length, 3);
  assert.deepEqual(replies.slice(0, 2), [
    "Who is Courtfolio for?",
    "How could a court journal help me?",
  ]);
  assert.ok(
    replies.every(
      (reply) => !/show me courtfolio|favorite food|script|https:/i.test(reply),
    ),
  );
});

test("a fresh answer from Mark replaces stale project chips with personal follow-ups", () => {
  const replies = getQuickReplies({
    focus: "conversation",
    context: { section: "work", project: "courtfolio" },
    conversation: [
      { role: "user", content: "What’s Mark’s favorite food?" },
      {
        role: "assistant",
        content: "I’ve asked Mark. His reply will appear here.",
      },
      {
        role: "mark",
        content: "Sinigang!",
        question: "What is Mark’s favorite food?",
      },
    ],
    candidates: ["Show me Courtfolio", "Try a dashboard", "Contact Mark"],
  });
  assert.equal(replies.length, 3);
  assert.ok(
    replies.every((reply) =>
      /cook|cuisine|food|fun|dish|dessert|home/i.test(reply),
    ),
  );
  assert.ok(
    replies.every(
      (reply) => !/courtfolio|dashboard|contact|favorite food/i.test(reply),
    ),
  );
});

test("keeps multilingual chips distinct while deduplicating punctuation and recent questions", () => {
  const replies = getQuickReplies({
    focus: "conversation",
    conversation: [{ role: "user", content: "كيف يعمل المشروع ١؟" }],
    candidates: [
      "كيف يعمل المشروع ١؟",
      "كيف يعمل المشروع ٢؟",
      "马克有什么爱好？",
      "马克有什么爱好！",
      "Какие проекты создал Марк?",
    ],
  });
  assert.deepEqual(replies, [
    "كيف يعمل المشروع ٢؟",
    "马克有什么爱好？",
    "Какие проекты создал Марк?",
  ]);
});

test("filters equivalent project feature questions even with a trailing opt-out sentence", () => {
  const replies = getQuickReplies({
    focus: "conversation",
    context: { project: "courtfolio" },
    conversation: [
      {
        role: "user",
        content: "What can Courtfolio do? Use existing knowledge only.",
      },
      {
        role: "assistant",
        content:
          "Courtfolio lets players discover courts and save their sessions.",
      },
    ],
    candidates: [
      "How does Courtfolio work?",
      "What features does Courtfolio have?",
      "What can Courtfolio do?",
      "What can players save in a session?",
      "How does HelloMarky work?",
      "How does Courtfolio work offline?",
    ],
  });
  assert.deepEqual(replies, [
    "What can players save in a session?",
    "How does HelloMarky work?",
    "How does Courtfolio work offline?",
  ]);
});

test("uses the same narrow feature key for every named project and spelling alias", () => {
  for (const [question, name] of [
    ["What features does Court Folio have? Don't contact Mark.", "Courtfolio"],
    ["How does Hello Marky work? Use existing knowledge only.", "HelloMarky"],
    ["What can Pickle-Pals do using existing knowledge only", "PicklePals"],
  ]) {
    const repeats = [
      `What can ${name} do?`,
      `What features does ${name} have?`,
      `How does ${name} work?`,
    ];
    const replies = getQuickReplies({
      focus: "conversation",
      conversation: [{ role: "user", content: question }],
      candidates: [...repeats, "What can players save in a session?"],
    });
    assert.equal(replies.length, 3);
    assert.equal(replies[0], "What can players save in a session?");
    assert.ok(replies.every((reply) => !repeats.includes(reply)));
  }
});

test("page focus follows the current section rather than an old conversation", () => {
  const common = {
    focus: "page" as const,
    conversation: [
      { role: "user" as const, content: "What’s Mark’s favorite food?" },
    ],
    candidates: ["What other food does Mark enjoy?"],
  };
  const skills = getQuickReplies({ ...common, context: { section: "skills" } });
  const experience = getQuickReplies({
    ...common,
    context: { section: "experience" },
  });
  const about = getQuickReplies({ ...common, context: { section: "about" } });
  const contact = getQuickReplies({
    ...common,
    context: { section: "contact" },
  });
  assert.ok(skills.some((reply) => /automate|agents|tools/i.test(reply)));
  assert.ok(experience.some((reply) => /role|roles|AI/i.test(reply)));
  assert.ok(about.some((reply) => /fun|inspire|travel/i.test(reply)));
  assert.ok(contact.some((reply) => /brief|idea|together/i.test(reply)));
  assert.notDeepEqual(skills, experience);
  assert.ok(
    [skills, experience, about, contact].every(
      (replies) => replies.length === 3,
    ),
  );
});

test("ready flower and email previews get useful next steps instead of a new build", () => {
  const flower = getQuickReplies({
    focus: "page",
    context: {
      section: "playground",
      preview: {
        status: "ready",
        prompt: "A website for my flower shop",
        nextAllowedAt: "2099-01-01T00:00:00Z",
      },
    },
  });
  const email = getQuickReplies({
    focus: "page",
    context: {
      section: "playground",
      preview: {
        status: "ready",
        prompt: "An email tracker automation",
        nextAllowedAt: "2099-01-01T00:00:00Z",
      },
    },
  });
  assert.ok(flower.some((reply) => /flower|bouquet|shop/i.test(reply)));
  assert.ok(email.some((reply) => /email|follow.up|human/i.test(reply)));
  assert.notDeepEqual(flower, email);
  assert.ok(
    [...flower, ...email].every(
      (reply) => !/^(build|try|generate|make|preview)\b/i.test(reply),
    ),
  );
});

test("generating and cooldown states filter fresh-build candidates but preserve discussion", () => {
  for (const preview of [
    { status: "generating" as const },
    { status: "ready" as const, nextAllowedAt: "2099-01-01T00:00:00Z" },
  ]) {
    const replies = getQuickReplies({
      focus: "conversation",
      context: { section: "playground", preview },
      conversation: [
        { role: "assistant", content: "Your idea is taking shape." },
      ],
      candidates: [
        "Build another preview",
        "Generate a new website",
        "Show me a dashboard",
        "Could you show me an automation?",
        "What should we build next?",
        "Build my preview again",
        "What should the first version include?",
      ],
    });
    assert.equal(replies.length, 3);
    assert.equal(replies[0], "What should the first version include?");
    assert.ok(
      replies.every(
        (reply) =>
          !/^(build|generate|show me a dashboard|try|preview)\b/i.test(reply),
      ),
    );
  }
  const available = getQuickReplies({
    focus: "page",
    context: {
      section: "playground",
      preview: { status: "empty", nextAllowedAt: "2000-01-01T00:00:00Z" },
    },
  });
  assert.ok(available.some((reply) => /^(try|preview)\b/i.test(reply)));
});

test("performed actions and recently asked questions cannot fill chips again", () => {
  const replies = getQuickReplies({
    focus: "conversation",
    conversation: [{ role: "user", content: "Which tools does Mark use?" }],
    candidates: [
      "Surprise me",
      "Reset the stickers",
      "Show me Mark’s experience",
      "Try a dashboard",
      "Which tools does Mark use?",
    ],
    actions: [
      { type: "celebrate" },
      { type: "reset-stickers" },
      { type: "navigate", target: "experience" },
      { type: "preview", kind: "dashboard" },
    ],
  });
  assert.equal(replies.length, 3);
  assert.ok(
    replies.every(
      (reply) =>
        !/surprise|reset|show me.*experience|try a dashboard|which tools does/i.test(
          reply,
        ),
    ),
  );
});
