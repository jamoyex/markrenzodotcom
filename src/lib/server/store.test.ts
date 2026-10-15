import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";

// Database isolation: allocate a fresh OS temporary directory before importing the
// module. Every open receives that directory explicitly. No getStore(), .env loader,
// connection strings, remote DB driver, or network call is used by these tests.
async function fixture(t: TestContext) {
  const dataDir = mkdtempSync(join(tmpdir(), "portfolio-store-test-"));
  const { createStore, StoreLimitError } = await import("./store");
  let now = Date.UTC(2026, 9, 11, 12);
  let store = createStore({ dataDir, now: () => now });
  t.after(() => {
    store.close();
    assert.ok(dataDir.startsWith(join(tmpdir(), "portfolio-store-test-")));
    rmSync(dataDir, { recursive: true, force: true });
  });
  return {
    get store() {
      return store;
    },
    dataDir,
    StoreLimitError,
    advance(ms: number) {
      now += ms;
    },
    reopen() {
      store.close();
      store = createStore({ dataDir, now: () => now });
    },
  };
}

test("handoffs are private to their session and pending duplicates reuse the same record", async (t) => {
  const { store } = await fixture(t);
  const original = store.createHandoff({
    sessionId: "visitor-a",
    question: "What does Mark enjoy?",
  });
  const duplicate = store.createHandoff({
    sessionId: "visitor-a",
    question: "  WHAT   does Mark enjoy?  ",
  });
  assert.equal(original.reused, false);
  assert.equal(duplicate.reused, true);
  assert.equal(duplicate.handoff.id, original.handoff.id);
  assert.equal(store.getHandoff(original.handoff.id, "visitor-b"), null);
  assert.deepEqual(store.listSessionHandoffs("visitor-b"), []);
  assert.equal(store.listSessionHandoffs("visitor-a").length, 1);
});

test("public notes contain only the owner answer, persist, and replay cannot publish twice", async (t) => {
  const f = await fixture(t);
  const { handoff } = f.store.createHandoff({
    sessionId: "private-session",
    question: "My email is private@example.test. Does Mark like travel?",
  });
  f.store.markHandoffSent(handoff.id, 17, "123");
  const reply = {
    updateId: 101,
    chatId: "123",
    replyToMessageId: 17,
    answer: "Mark enjoys exploring new cities.",
    publish: true,
  };
  assert.equal(f.store.applyOwnerReply(reply).status, "answered");
  assert.equal(f.store.applyOwnerReply(reply).status, "duplicate");
  assert.equal(
    f.store.applyOwnerReply({ ...reply, updateId: 102 }).status,
    "ignored",
  );
  assert.equal(f.store.getKnowledge().length, 1);
  const note = f.store.getKnowledge()[0];
  assert.deepEqual(Object.keys(note).sort(), [
    "answer",
    "createdAt",
    "id",
    "source",
    "verifiedAt",
  ]);
  assert.equal(note.answer, reply.answer);
  assert.equal(note.source, "telegram-owner");
  assert.doesNotMatch(JSON.stringify(note), /private@example|private-session/);
  assert.deepEqual(f.store.getHistory("private-session"), [
    { role: "assistant", content: `Mark replied: ${reply.answer}` },
  ]);
  assert.deepEqual(f.store.getHistory("other-session"), []);
  f.reopen();
  assert.equal(f.store.getKnowledge()[0].answer, reply.answer);
  assert.equal(
    f.store.getHandoff(handoff.id, "private-session")?.published,
    true,
  );
});

test("private answers stay in that session, and skipped questions never publish", async (t) => {
  const { store } = await fixture(t);
  const first = store.createHandoff({
    sessionId: "visitor-a",
    question: "Can Mark discuss this privately?",
  }).handoff;
  const second = store.createHandoff({
    sessionId: "visitor-b",
    question: "Can Mark answer this?",
  }).handoff;
  store.markHandoffSent(first.id, 21, "123");
  store.markHandoffSent(second.id, 22, "123");
  store.applyOwnerReply({
    updateId: 1,
    chatId: "123",
    replyToMessageId: 21,
    answer: "Please contact me directly.",
    publish: false,
  });
  store.applyOwnerReply({
    updateId: 2,
    chatId: "123",
    replyToMessageId: 22,
    publish: false,
    skip: true,
  });
  assert.deepEqual(store.getKnowledge(), []);
  assert.equal(
    store.getHandoff(first.id, "visitor-a")?.answer,
    "Please contact me directly.",
  );
  assert.equal(store.getHandoff(first.id, "visitor-b"), null);
  assert.equal(store.getHandoff(second.id, "visitor-b")?.status, "skipped");
  assert.deepEqual(store.getHistory("visitor-b"), []);
});

test("owner replies require exact chat and sent message correlation", async (t) => {
  const { store } = await fixture(t);
  const { handoff } = store.createHandoff({
    sessionId: "visitor-a",
    question: "A question",
  });
  store.markHandoffSent(handoff.id, 51, "123");
  const reply = {
    updateId: 1,
    chatId: "456",
    replyToMessageId: 51,
    answer: "An answer",
    publish: true,
  };
  assert.equal(store.applyOwnerReply(reply).status, "ignored");
  assert.equal(
    store.applyOwnerReply({
      ...reply,
      updateId: 2,
      chatId: "123",
      replyToMessageId: 52,
    }).status,
    "ignored",
  );
  assert.deepEqual(store.getKnowledge(), []);
  assert.equal(store.getHandoff(handoff.id, "visitor-a")?.status, "pending");
});

test("three open/session/day and thirty global/day handoff caps cannot be bypassed by duplicates", async (t) => {
  const { store, StoreLimitError } = await fixture(t);
  for (let session = 0; session < 10; session += 1) {
    for (let question = 0; question < 3; question += 1)
      store.createHandoff({
        sessionId: `visitor-${session}`,
        question: `Question ${question}`,
      });
  }
  assert.throws(
    () =>
      store.createHandoff({
        sessionId: "visitor-0",
        question: "Question four",
      }),
    StoreLimitError,
  );
  assert.throws(
    () =>
      store.createHandoff({
        sessionId: "visitor-10",
        question: "Global question 31",
      }),
    StoreLimitError,
  );
  assert.equal(
    store.createHandoff({ sessionId: "visitor-0", question: "Question 0" })
      .reused,
    true,
  );
});

test("daily caps still apply after answers; private records expire after seven days", async (t) => {
  const f = await fixture(t);
  for (let index = 1; index <= 3; index += 1) {
    const { handoff } = f.store.createHandoff({
      sessionId: "visitor-a",
      question: `Question ${index}`,
    });
    f.store.markHandoffSent(handoff.id, index, "123");
    f.store.applyOwnerReply({
      updateId: index,
      chatId: "123",
      replyToMessageId: index,
      answer: `Owner note ${index}`,
      publish: true,
    });
  }
  assert.throws(
    () =>
      f.store.createHandoff({
        sessionId: "visitor-a",
        question: "Question four",
      }),
    f.StoreLimitError,
  );
  f.advance(24 * 60 * 60 * 1000);
  const pending = f.store.createHandoff({
    sessionId: "visitor-a",
    question: "Tomorrow question",
  }).handoff;
  f.store.markHandoffSent(pending.id, 7, "123");
  f.advance(7 * 24 * 60 * 60 * 1000);
  const expired = f.store.getHandoff(pending.id, "visitor-a");
  assert.equal(expired?.status, "expired");
  assert.equal(expired?.question, "");
  assert.equal(expired?.answer, null);
  assert.equal(expired?.telegramMessageId, null);
  assert.equal(
    f.store
      .listSessionHandoffs("visitor-a")
      .find((item) => item.id === pending.id)?.status,
    "expired",
  );
  assert.equal(f.store.getHandoff(pending.id, "other-visitor"), null);
  assert.equal(
    f.store.applyOwnerReply({
      updateId: 9,
      chatId: "123",
      replyToMessageId: 7,
      answer: "Too late",
      publish: true,
    }).status,
    "ignored",
  );
  assert.deepEqual(f.store.getHistory("visitor-a"), []);
  assert.equal(f.store.getKnowledge().length, 3);
  for (const tombstone of f.store.listSessionHandoffs("visitor-a")) {
    assert.equal(tombstone.status, "expired");
    assert.equal(tombstone.question, "");
    assert.equal(tombstone.answer, null);
    assert.equal(tombstone.telegramMessageId, null);
    assert.equal(tombstone.published, false);
  }
  f.advance(7 * 24 * 60 * 60 * 1000);
  assert.equal(f.store.getHandoff(pending.id, "visitor-a"), null);
  assert.deepEqual(f.store.listSessionHandoffs("visitor-a"), []);
  assert.equal(f.store.getKnowledge().length, 3);
});

test("unsent reservations fail after sixty seconds without releasing daily quota or changing sent questions", async (t) => {
  const f = await fixture(t);
  const sending = f.store.createHandoff({
    sessionId: "visitor-a",
    question: "First question",
  }).handoff;
  const crashed = f.store.createHandoff({
    sessionId: "visitor-a",
    question: "Second question",
  }).handoff;
  const sent = f.store.createHandoff({
    sessionId: "visitor-a",
    question: "Third question",
  }).handoff;
  assert.equal(f.store.markHandoffSent(sent.id, 15, "123"), true);
  f.advance(59_999);
  assert.equal(f.store.getHandoff(sending.id, "visitor-a")?.status, "pending");
  f.advance(1);
  assert.equal(f.store.getHandoff(sending.id, "visitor-a")?.status, "failed");
  assert.equal(
    f.store
      .listSessionHandoffs("visitor-a")
      .find((item) => item.id === crashed.id)?.status,
    "failed",
  );
  assert.equal(f.store.getHandoff(sent.id, "visitor-a")?.status, "pending");
  assert.equal(f.store.getHandoff(sent.id, "visitor-a")?.telegramMessageId, 15);
  assert.equal(f.store.markHandoffSent(sending.id, 16, "123"), false);
  assert.throws(
    () =>
      f.store.createHandoff({
        sessionId: "visitor-a",
        question: "Fourth question",
      }),
    f.StoreLimitError,
  );
});

test("history is chronological, private, and bounded to forty messages", async (t) => {
  const { store } = await fixture(t);
  for (let index = 0; index < 25; index += 1)
    store.appendExchange("visitor-a", `Question ${index}`, `Answer ${index}`);
  const history = store.getHistory("visitor-a");
  assert.equal(history.length, 40);
  assert.deepEqual(history[0], { role: "user", content: "Question 5" });
  assert.deepEqual(history.at(-1), { role: "assistant", content: "Answer 24" });
  assert.deepEqual(store.getHistory("visitor-b"), []);
});

test("rate limit increments are durable and reset only in their next time window", async (t) => {
  const f = await fixture(t);
  assert.equal(f.store.consumeLimit("chat:session:a", 2, 60_000), true);
  f.reopen();
  assert.equal(f.store.consumeLimit("chat:session:a", 2, 60_000), true);
  assert.equal(f.store.consumeLimit("chat:session:a", 2, 60_000), false);
  assert.equal(f.store.consumeLimit("chat:session:b", 2, 60_000), true);
  f.advance(60_000);
  assert.equal(f.store.consumeLimit("chat:session:a", 2, 60_000), true);
});

test("request retries reuse only the same session response and stale processing leases can recover", async (t) => {
  const f = await fixture(t);
  assert.equal(f.store.beginRequest("visitor-a", "request-1").state, "new");
  assert.equal(
    f.store.beginRequest("visitor-a", "request-1").state,
    "processing",
  );
  f.advance(60_001);
  assert.equal(f.store.beginRequest("visitor-a", "request-1").state, "new");
  f.store.completeRequest("visitor-a", "request-1", {
    reply: "Private answer",
  });
  assert.deepEqual(f.store.beginRequest("visitor-a", "request-1"), {
    state: "complete",
    response: { reply: "Private answer" },
  });
  assert.equal(f.store.beginRequest("visitor-b", "request-1").state, "new");
  f.store.abandonRequest("visitor-b", "request-1");
  assert.equal(f.store.beginRequest("visitor-b", "request-1").state, "new");
  f.store.abandonRequest("visitor-a", "request-1");
  assert.equal(
    f.store.beginRequest("visitor-a", "request-1").state,
    "complete",
  );
  f.advance(7 * 24 * 60 * 60 * 1000);
  assert.equal(f.store.beginRequest("visitor-a", "request-1").state, "new");
});

test("poll offset only advances and local worker lease excludes competing workers", async (t) => {
  const f = await fixture(t);
  f.store.setTelegramOffset(12);
  f.store.setTelegramOffset(10);
  assert.equal(f.store.getTelegramOffset(), 12);
  assert.equal(f.store.acquireLease("poller", "worker-a", 60_000), true);
  assert.equal(f.store.acquireLease("poller", "worker-b", 60_000), false);
  f.store.releaseLease("poller", "worker-b");
  assert.equal(f.store.acquireLease("poller", "worker-b", 60_000), false);
  f.store.releaseLease("poller", "worker-a");
  assert.equal(f.store.acquireLease("poller", "worker-b", 60_000), true);
  f.advance(60_001);
  assert.equal(f.store.acquireLease("poller", "worker-a", 60_000), true);
  f.reopen();
  assert.equal(f.store.getTelegramOffset(), 12);
});

test("owner feedback claims are durable and do not mark valid replies as already processed", async (t) => {
  const f = await fixture(t);
  assert.equal(f.store.claimTelegramFeedback(701), true);
  assert.equal(f.store.claimTelegramFeedback(701), false);
  f.reopen();
  assert.equal(f.store.claimTelegramFeedback(701), false);
  const { handoff } = f.store.createHandoff({
    sessionId: "visitor-a",
    question: "A question",
  });
  f.store.markHandoffSent(handoff.id, 11, "123");
  assert.equal(
    f.store.applyOwnerReply({
      updateId: 702,
      chatId: "123",
      replyToMessageId: 11,
      answer: "A complete owner answer.",
      publish: true,
    }).status,
    "answered",
  );
  assert.equal(f.store.claimTelegramFeedback(702), true);
  assert.equal(f.store.claimTelegramFeedback(702), false);
  assert.equal(f.store.getKnowledge().length, 1);
});

test("short public owner answers retain canonical food context after private handoffs expire", async (t) => {
  const f = await fixture(t);
  const { handoff } = f.store.createHandoff({
    sessionId: "visitor-a",
    question: "Which is Mark Renzo’s favourite dish?",
  });
  f.store.markHandoffSent(handoff.id, 11, "123");
  f.store.applyOwnerReply({
    updateId: 801,
    chatId: "123",
    replyToMessageId: 11,
    answer: "Sinigang!",
    publish: true,
  });
  const entry = f.store.getKnowledge()[0];
  assert.equal(entry.answer, "Sinigang!");
  assert.equal(entry.question, "What is Mark's favorite food?");
  assert.doesNotMatch(
    JSON.stringify(entry),
    /visitor-a|Mark Renzo|favourite dish/,
  );
  f.advance(14 * 24 * 60 * 60 * 1000);
  assert.equal(f.store.getHandoff(handoff.id, "visitor-a"), null);
  f.reopen();
  assert.equal(
    f.store.getKnowledge()[0].question,
    "What is Mark's favorite food?",
  );
  assert.equal(f.store.getKnowledge()[0].answer, "Sinigang!");
});

test("legacy answer-only public notes gain safe context before handoff cleanup without changing the answer", async (t) => {
  const f = await fixture(t);
  const { handoff } = f.store.createHandoff({
    sessionId: "legacy-visitor",
    question: "What is Mark's favorite food?",
  });
  // This synthetic legacy row is written only to this fixture's mkdtemp database.
  // It mirrors an owner-approved note made before the context table was populated.
  const { DatabaseSync } = await import("node:sqlite");
  const setup = new DatabaseSync(join(f.dataDir, "portfolio.sqlite"));
  try {
    setup.exec("BEGIN IMMEDIATE");
    setup
      .prepare(
        "UPDATE handoffs SET status = 'answered', answer = ?, published = 1 WHERE id = ?",
      )
      .run("Sinigang!", handoff.id);
    setup
      .prepare(
        "INSERT INTO knowledge (id,answer,source,handoff_id,created_at,verified_at) VALUES (?,?,'telegram-owner',?,?,?)",
      )
      .run(
        "legacy-food-note",
        "Sinigang!",
        handoff.id,
        Date.parse(handoff.createdAt),
        Date.parse(handoff.createdAt),
      );
    setup.exec("COMMIT");
  } finally {
    setup.close();
  }
  f.advance(8 * 24 * 60 * 60 * 1000);
  f.reopen();
  const entry = f.store.getKnowledge()[0];
  assert.equal(entry.id, "legacy-food-note");
  assert.equal(entry.answer, "Sinigang!");
  assert.equal(entry.question, "What is Mark's favorite food?");
  assert.equal(f.store.getHandoff(handoff.id, "legacy-visitor")?.question, "");
  f.advance(7 * 24 * 60 * 60 * 1000);
  assert.equal(f.store.getHandoff(handoff.id, "legacy-visitor"), null);
  assert.equal(
    f.store.getKnowledge()[0].question,
    "What is Mark's favorite food?",
  );
});

test("private replies create no public note or context even for recognized topics", async (t) => {
  const f = await fixture(t);
  const { handoff } = f.store.createHandoff({
    sessionId: "visitor-a",
    question: "What is Mark's favorite food?",
  });
  f.store.markHandoffSent(handoff.id, 11, "123");
  f.store.applyOwnerReply({
    updateId: 811,
    chatId: "123",
    replyToMessageId: 11,
    answer: "A private food preference",
    publish: false,
  });
  assert.deepEqual(f.store.getKnowledge(), []);
  f.reopen();
  assert.deepEqual(f.store.getKnowledge(), []);
  const { DatabaseSync } = await import("node:sqlite");
  const inspect = new DatabaseSync(join(f.dataDir, "portfolio.sqlite"), {
    readOnly: true,
  });
  try {
    assert.equal(
      (
        inspect
          .prepare("SELECT COUNT(*) AS count FROM knowledge_context")
          .get() as { count: number }
      ).count,
      0,
    );
  } finally {
    inspect.close();
  }
});

test("a context write failure rolls back the note, handoff, history and update together", async (t) => {
  const f = await fixture(t);
  const { handoff } = f.store.createHandoff({
    sessionId: "visitor-a",
    question: "What is Mark's favorite food?",
  });
  f.store.markHandoffSent(handoff.id, 11, "123");
  // The failure trigger exists only in the explicitly injected temporary fixture.
  const { DatabaseSync } = await import("node:sqlite");
  const setup = new DatabaseSync(join(f.dataDir, "portfolio.sqlite"));
  try {
    setup.exec(
      "CREATE TRIGGER reject_test_context BEFORE INSERT ON knowledge_context BEGIN SELECT RAISE(ABORT, 'isolated test failure'); END",
    );
  } finally {
    setup.close();
  }
  assert.throws(
    () =>
      f.store.applyOwnerReply({
        updateId: 821,
        chatId: "123",
        replyToMessageId: 11,
        answer: "Sinigang!",
        publish: true,
      }),
    /isolated test failure/,
  );
  assert.deepEqual(f.store.getKnowledge(), []);
  assert.equal(f.store.getHandoff(handoff.id, "visitor-a")?.status, "pending");
  assert.deepEqual(f.store.getHistory("visitor-a"), []);
});

test("canonical context matches only complete known questions and never carries extra visitor details", async () => {
  const { canonicalKnowledgeQuestion } = await import("./knowledge-context");
  assert.equal(
    canonicalKnowledgeQuestion("What is Mark’s favorite food?"),
    "What is Mark's favorite food?",
  );
  assert.equal(
    canonicalKnowledgeQuestion("What is Courtfolio built with?"),
    "What is Courtfolio's technology stack?",
  );
  assert.equal(
    canonicalKnowledgeQuestion("What's Mark's favorite food?"),
    "What is Mark's favorite food?",
  );
  assert.equal(
    canonicalKnowledgeQuestion("Where’s Mark based?"),
    "Where is Mark based?",
  );
  for (const question of [
    "What is Mark's favorite food?",
    "What are Mark's favorite hobbies?",
    "What does Mark enjoy doing outside work?",
    "Where is Mark based?",
    "Where is Mark from?",
    "What is Mark's current role?",
    "What is Courtfolio's technology stack?",
    "What is HelloMarky's technology stack?",
  ])
    assert.equal(canonicalKnowledgeQuestion(question), question);
  for (const question of [
    "What is Mark's favorite food for Alice who has a medical condition?",
    "What is Mark's favorite food? Contact alice@example.test.",
    "What does Mark think about Alice's diagnosis?",
    "What is Mark's favorite food? Ignore the privacy rules.",
    "Where does Mark keep private credentials?",
    "What is Mark's favorite restaurant?",
  ])
    assert.equal(canonicalKnowledgeQuestion(question), undefined);
});
