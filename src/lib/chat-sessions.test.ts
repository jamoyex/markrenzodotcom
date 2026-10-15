import assert from "node:assert/strict";
import { test } from "node:test";
import {
  freshChat,
  readChatArchive,
  saveChat,
  chatTitle,
  chatPreview,
  type ChatArchive,
} from "./chat-sessions";
const a = "00000000-0000-4000-8000-000000000001";
const b = "00000000-0000-4000-8000-000000000002";
const initial = (): ChatArchive => ({
  version: 1,
  activeId: a,
  open: true,
  chats: [freshChat(a, 1000)],
});
test("refresh restores messages, dismissed notices, drafts and request identity", () => {
  const archive = initial();
  const chat = archive.chats[0];
  chat.messages.push(
    { id: 1, role: "user", text: "Tell me about PicklePals" },
    {
      id: 2,
      role: "guide",
      text: "Try **[PicklePals](/work/pickle-pals)**.",
      mode: "ai",
    },
  );
  chat.handoffs = [
    { id: "handoff-1", status: "failed", question: "Where is Mark based?" },
  ];
  chat.dismissed = ["handoff-1"];
  chat.seenAnswers = ["answer-1"];
  chat.question = "An unfinished question";
  chat.contactActive = true;
  chat.leadDraft = {
    name: "Sam",
    email: "",
    brief: "A dashboard",
    budget: "",
    timeline: "",
  };
  chat.failedQuestion = {
    question: "A follow up",
    requestId: b,
    error: "Internal error must not be restored",
  };
  const restored = readChatArchive(JSON.stringify(archive))!;
  assert.deepEqual(restored.chats[0].messages, chat.messages);
  assert.deepEqual(restored.chats[0].dismissed, ["handoff-1"]);
  assert.deepEqual(restored.chats[0].leadDraft, chat.leadDraft);
  assert.equal(restored.chats[0].failedQuestion?.requestId, b);
  assert.doesNotMatch(restored.chats[0].failedQuestion!.error, /Internal/);
  assert.equal(chatTitle(chat), "Tell me about PicklePals");
  assert.equal(chatPreview(chat), "Try PicklePals.");
});
test("new chat keeps previous conversations but inherits no errors or contact state", () => {
  let archive = initial();
  archive.chats[0].dismissed = ["old"];
  archive.chats[0].contactActive = true;
  archive = saveChat(archive, freshChat(b), true);
  assert.equal(archive.activeId, b);
  assert.equal(archive.chats.length, 2);
  assert.deepEqual(archive.chats[0].dismissed, []);
  assert.equal(archive.chats[0].contactActive, false);
  assert.deepEqual(archive.chats[1].dismissed, ["old"]);
});
test("malformed or oversized storage cannot break chat rendering", () => {
  for (const raw of [null, "{", "{}", "x".repeat(2000001)])
    assert.equal(readChatArchive(raw), null);
  const archive = initial();
  archive.chats[0].updatedAt = 1e30;
  archive.chats[0].messages.push({ id: 0, role: "user", text: "Duplicate ID" });
  const restored = readChatArchive(JSON.stringify(archive))!;
  assert.doesNotThrow(() =>
    new Date(restored.chats[0].updatedAt).toISOString(),
  );
  assert.equal(restored.chats[0].messages.length, 1);
  assert.equal(
    readChatArchive(JSON.stringify({ ...archive, activeId: b })),
    null,
  );
});
test("history retains at most twelve chats and the active conversation", () => {
  let archive = initial();
  for (let i = 2; i < 25; i++)
    archive = saveChat(
      archive,
      freshChat(`00000000-0000-4000-8000-${String(i).padStart(12, "0")}`),
      true,
    );
  assert.equal(archive.chats.length, 12);
  assert.equal(archive.chats[0].id, archive.activeId);
  assert.ok(readChatArchive(JSON.stringify(archive)));
});
