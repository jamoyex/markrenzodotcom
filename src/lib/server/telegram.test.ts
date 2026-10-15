import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";

// Explicit temporary local SQLite and injected fake config/fetch only. Do not load
// .env files, call getStore(), or use the real Telegram API in this test selection.
async function fixture(t: TestContext) {
  const dataDir = mkdtempSync(join(tmpdir(), "portfolio-telegram-test-"));
  const { createStore } = await import("./store");
  const telegram = await import("./telegram");
  let now = Date.UTC(2026, 9, 11, 12);
  const store = createStore({ dataDir, now: () => now });
  t.after(() => {
    store.close();
    assert.ok(dataDir.startsWith(join(tmpdir(), "portfolio-telegram-test-")));
    rmSync(dataDir, { recursive: true, force: true });
  });
  const config = {
    botToken: "12345:TEST_ONLY_FAKE_BOT_TOKEN_NEVER_REAL",
    ownerChatId: "123",
    ownerUserId: "456",
    webhookSecret: "test-only-webhook-secret-32-characters",
  };
  return {
    store,
    config,
    fetchImpl: (async () => {
      throw new Error("Unexpected network call in isolated test.");
    }) as typeof fetch,
    advance(ms: number) {
      now += ms;
    },
    ...telegram,
  };
}

function ownerUpdate(
  updateId = 1,
  text = "Mark enjoys making useful things.",
  replyTo = 11,
) {
  return {
    update_id: updateId,
    message: {
      message_id: 100 + updateId,
      text,
      chat: { id: 123, type: "private" },
      from: { id: 456, is_bot: false },
      reply_to_message: { message_id: replyTo },
    },
  };
}

test("unconfigured Telegram reports unavailable without sending or creating a handoff", async (t) => {
  const f = await fixture(t);
  const result = await f.escalateToTelegram(
    { sessionId: "visitor-a", question: "A question" },
    {
      store: f.store,
      config: null,
      fetchImpl: async () => {
        throw new Error("Unexpected network call");
      },
    },
  );
  assert.deepEqual(result, { status: "unavailable" });
  assert.deepEqual(f.store.listSessionHandoffs("visitor-a"), []);
});

test("one delivery contains the public/private warning and pending retries do not send again", async (t) => {
  const f = await fixture(t);
  const requests: Record<string, unknown>[] = [];
  const fetchImpl: typeof fetch = async (_url, init) => {
    assert.equal(init?.redirect, "error");
    requests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return Response.json({
      ok: true,
      result: { message_id: 11, chat: { id: 123 } },
    });
  };
  const input = {
    sessionId: "visitor-a",
    question: "What does Mark enjoy outside work?",
  };
  const result = await f.escalateToTelegram(input, { ...f, fetchImpl });
  const retry = await f.escalateToTelegram(input, { ...f, fetchImpl });
  assert.equal(result.status, "pending");
  assert.equal(retry.id, result.id);
  assert.equal(retry.reused, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].chat_id, "123");
  assert.match(String(requests[0].text), /PUBLIC/);
  assert.match(String(requests[0].text), /self-contained/);
  assert.match(String(requests[0].text), /\/private/);
  assert.match(String(requests[0].text), /\/skip/);
  assert.deepEqual(requests[0].reply_markup, {
    force_reply: true,
    input_field_placeholder: "Public answer, /private answer, or /skip",
  });
  assert.equal(
    f.store.getHandoff(result.id!, "visitor-a")?.telegramMessageId,
    11,
  );
});

test("a duplicate while sendMessage is in flight reports processing until delivery is confirmed", async (t) => {
  const f = await fixture(t);
  let finishDelivery!: (response: Response) => void;
  const delivery = new Promise<Response>((resolve) => {
    finishDelivery = resolve;
  });
  let calls = 0;
  const fetchImpl: typeof fetch = async () => {
    calls += 1;
    return delivery;
  };
  const input = { sessionId: "visitor-a", question: "A neutral question" };
  const firstRequest = f.escalateToTelegram(input, { ...f, fetchImpl });
  const duplicate = await f.escalateToTelegram(input, { ...f, fetchImpl });
  assert.equal(duplicate.status, "processing");
  assert.equal(duplicate.reused, true);
  assert.equal(
    f.store.getHandoff(duplicate.id!, "visitor-a")?.telegramMessageId,
    null,
  );
  assert.equal(calls, 1);
  finishDelivery(
    Response.json({ ok: true, result: { message_id: 11, chat: { id: 123 } } }),
  );
  const delivered = await firstRequest;
  assert.equal(delivered.status, "pending");
  assert.equal(delivered.id, duplicate.id);
  assert.equal(
    f.store.getHandoff(delivered.id!, "visitor-a")?.telegramMessageId,
    11,
  );
});

test("a send result cannot revive a reservation that passed the stale send deadline", async (t) => {
  const f = await fixture(t);
  const result = await f.escalateToTelegram(
    { sessionId: "visitor-a", question: "A question" },
    {
      ...f,
      fetchImpl: async () => {
        f.advance(60_001);
        return Response.json({
          ok: true,
          result: { message_id: 11, chat: { id: 123 } },
        });
      },
    },
  );
  assert.equal(result.status, "failed");
  assert.equal(f.store.getHandoff(result.id!, "visitor-a")?.status, "failed");
  assert.equal(
    f.store.getHandoff(result.id!, "visitor-a")?.telegramMessageId,
    null,
  );
});

test("owner chat, sender, private chat, and exact reply target must all match before publishing", async (t) => {
  const f = await fixture(t);
  const { handoff } = f.store.createHandoff({
    sessionId: "visitor-a",
    question: "A question",
  });
  f.store.markHandoffSent(handoff.id, 11, f.config.ownerChatId);
  const wrongUser = ownerUpdate(1);
  wrongUser.message.from.id = 999;
  const wrongChat = ownerUpdate(2);
  wrongChat.message.chat.id = 999;
  const groupChat = ownerUpdate(3);
  groupChat.message.chat.type = "group";
  const botSender = ownerUpdate(4);
  botSender.message.from.is_bot = true;
  for (const update of [
    wrongUser,
    wrongChat,
    groupChat,
    botSender,
    ownerUpdate(5, "Wrong target", 12),
    { update_id: 6, message: { text: "Unsolicited command" } },
  ]) {
    assert.equal(f.processTelegramUpdate(update, f).status, "ignored");
  }
  assert.deepEqual(f.store.getKnowledge(), []);
  assert.equal(f.processTelegramUpdate(ownerUpdate(7), f).status, "answered");
  assert.equal(f.processTelegramUpdate(ownerUpdate(7), f).status, "duplicate");
  assert.equal(f.store.getKnowledge().length, 1);
});

test("/private answers only that visitor; /skip closes; other and empty commands cannot publish", async (t) => {
  const f = await fixture(t);
  const first = f.store.createHandoff({
    sessionId: "visitor-a",
    question: "Private question",
  }).handoff;
  const second = f.store.createHandoff({
    sessionId: "visitor-b",
    question: "Another question",
  }).handoff;
  f.store.markHandoffSent(first.id, 11, f.config.ownerChatId);
  f.store.markHandoffSent(second.id, 12, f.config.ownerChatId);
  for (const [id, text] of [
    [1, "/private"],
    [2, "/start secret"],
    [3, "/help"],
  ] as const) {
    assert.equal(
      f.processTelegramUpdate(ownerUpdate(id, text), f).status,
      "ignored",
    );
  }
  assert.equal(
    f.processTelegramUpdate(
      ownerUpdate(4, "/private Please contact Mark directly."),
      f,
    ).status,
    "answered",
  );
  assert.equal(
    f.processTelegramUpdate(ownerUpdate(5, "/skip", 12), f).status,
    "skipped",
  );
  assert.deepEqual(f.store.getKnowledge(), []);
  assert.equal(
    f.store.getHandoff(first.id, "visitor-a")?.answer,
    "Please contact Mark directly.",
  );
  assert.deepEqual(f.store.getHistory("visitor-b"), []);
  assert.equal(f.store.getHandoff(first.id, "visitor-b"), null);
});

test("ambiguous provider failures do not retry, leak secrets, or claim the question was sent", async (t) => {
  const f = await fixture(t);
  let calls = 0;
  const result = await f.escalateToTelegram(
    { sessionId: "visitor-a", question: "A question" },
    {
      ...f,
      fetchImpl: async () => {
        calls += 1;
        throw new Error(`Failed URL with ${f.config.botToken}`);
      },
    },
  );
  assert.equal(calls, 1);
  assert.equal(result.status, "failed");
  assert.doesNotMatch(JSON.stringify(result), /TEST_ONLY|botToken/);
  assert.equal(f.store.getHandoff(result.id!, "visitor-a")?.status, "failed");
  assert.deepEqual(f.store.getKnowledge(), []);
  await assert.rejects(
    () =>
      f.callTelegram(
        "getWebhookInfo",
        {},
        {
          config: f.config,
          fetchImpl: async () =>
            Response.json({
              ok: false,
              description: f.config.botToken,
              error_code: 401,
            }),
        },
      ),
    (error: unknown) => {
      assert.ok(error instanceof f.TelegramServiceError);
      assert.equal(error.status, 401);
      assert.doesNotMatch(error.message, /TEST_ONLY/);
      return true;
    },
  );
});

test("handoff limits return limited before an additional delivery is attempted", async (t) => {
  const f = await fixture(t);
  for (let id = 0; id < 3; id += 1)
    f.store.createHandoff({
      sessionId: "visitor-a",
      question: `Question ${id}`,
    });
  const result = await f.escalateToTelegram(
    { sessionId: "visitor-a", question: "Question four" },
    {
      ...f,
      fetchImpl: async () => {
        throw new Error("Unexpected network call");
      },
    },
  );
  assert.deepEqual(result, { status: "limited" });
});

test("webhook fails closed without the secret and handles bounded, authenticated JSON", async (t) => {
  const f = await fixture(t);
  const { handoff } = f.store.createHandoff({
    sessionId: "visitor-a",
    question: "A question",
  });
  f.store.markHandoffSent(handoff.id, 11, f.config.ownerChatId);
  const request = (
    body: string,
    secret?: string,
    extra: Record<string, string> = {},
  ) =>
    new Request("http://localhost/api/telegram/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "X-Telegram-Bot-Api-Secret-Token": secret } : {}),
        ...extra,
      },
      body,
    });
  assert.equal((await f.handleTelegramWebhook(request("{}"), f)).status, 401);
  assert.equal(
    (
      await f.handleTelegramWebhook(
        request("{}", "wrong-but-long-enough-secret"),
        f,
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await f.handleTelegramWebhook(request("{}", f.config.webhookSecret), {
        ...f,
        config: { ...f.config, webhookSecret: undefined },
      })
    ).status,
    503,
  );
  assert.equal(
    (
      await f.handleTelegramWebhook(
        request("{broken", f.config.webhookSecret),
        f,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await f.handleTelegramWebhook(
        request("{}", f.config.webhookSecret, { "Content-Length": "65537" }),
        f,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await f.handleTelegramWebhook(
        request(" ".repeat(65537), f.config.webhookSecret),
        f,
      )
    ).status,
    400,
  );
  assert.deepEqual(f.store.getKnowledge(), []);
  const success = await f.handleTelegramWebhook(
    request(JSON.stringify(ownerUpdate()), f.config.webhookSecret),
    f,
  );
  assert.equal(success.status, 200);
  assert.equal(success.headers.get("cache-control"), "no-store");
  assert.equal(f.store.getKnowledge().length, 1);
});

test("webhook secret comparison rejects missing, malformed, and unequal inputs", async (t) => {
  const f = await fixture(t);
  assert.equal(
    f.isValidWebhookSecret(f.config.webhookSecret, f.config.webhookSecret),
    true,
  );
  assert.equal(f.isValidWebhookSecret(null, f.config.webhookSecret), false);
  assert.equal(
    f.isValidWebhookSecret(f.config.webhookSecret, undefined),
    false,
  );
  assert.equal(f.isValidWebhookSecret("x", f.config.webhookSecret), false);
  assert.equal(f.isValidWebhookSecret("short", "short"), false);
  assert.equal(
    f.isValidWebhookSecret("x".repeat(257), f.config.webhookSecret),
    false,
  );
});

test("unmatched owner text receives one private correction without attaching or publishing it", async (t) => {
  const f = await fixture(t);
  const { handoff } = f.store.createHandoff({
    sessionId: "visitor-a",
    question: "A neutral question",
  });
  f.store.markHandoffSent(handoff.id, 11, f.config.ownerChatId);
  const original = ownerUpdate(
    31,
    "This contains confidential business information.",
  );
  const { reply_to_message: ignoredTarget, ...message } = original.message;
  void ignoredTarget;
  const update = { ...original, message };
  const sent: Record<string, unknown>[] = [];
  const fetchImpl: typeof fetch = async (_url, init) => {
    sent.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return Response.json({
      ok: true,
      result: { message_id: 70, chat: { id: 123 } },
    });
  };
  const result = await f.handleTelegramUpdate(update, { ...f, fetchImpl });
  assert.equal(result.status, "ignored");
  assert.equal(result.reason, "nonreply");
  assert.equal(result.feedback, "sent");
  assert.equal(sent.length, 1);
  assert.equal(sent[0].chat_id, f.config.ownerChatId);
  assert.match(
    String(sent[0].text),
    /Please use Reply on the Portfolio question message/,
  );
  assert.match(String(sent[0].text), /Nothing was published/);
  assert.doesNotMatch(
    JSON.stringify(sent),
    /confidential business|visitor-a|neutral question/,
  );
  assert.deepEqual(f.store.getKnowledge(), []);
  assert.deepEqual(f.store.getHistory("visitor-a"), []);
  assert.equal(f.store.getHandoff(handoff.id, "visitor-a")?.status, "pending");
  assert.equal(
    (await f.handleTelegramUpdate(update, { ...f, fetchImpl })).feedback,
    "duplicate",
  );
  assert.equal(sent.length, 1);
});

test("corrections never go to unpaired users or /start commands, and unsupported owner responses remain private", async (t) => {
  const f = await fixture(t);
  const sent: Record<string, unknown>[] = [];
  const fetchImpl: typeof fetch = async (_url, init) => {
    sent.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return Response.json({
      ok: true,
      result: { message_id: 70, chat: { id: 123 } },
    });
  };
  const foreign = ownerUpdate(40);
  foreign.message.from.id = 999;
  const rejected = await f.handleTelegramUpdate(foreign, { ...f, fetchImpl });
  assert.equal(rejected.reason, "identity_mismatch");
  assert.equal(rejected.feedback, undefined);
  const start = await f.handleTelegramUpdate(
    ownerUpdate(41, "/start private-pairing-nonce"),
    { ...f, fetchImpl },
  );
  assert.equal(start.reason, "unrecognized_command");
  assert.equal(start.feedback, undefined);
  assert.equal(sent.length, 0);
  const unsupported = {
    update_id: 42,
    message: {
      message_id: 142,
      chat: { id: 123, type: "private" },
      from: { id: 456, is_bot: false },
      voice: { file_id: "private-voice-reference" },
      reply_to_message: { message_id: 11 },
    },
  };
  const result = await f.handleTelegramUpdate(unsupported, { ...f, fetchImpl });
  assert.equal(result.reason, "unsupported");
  assert.equal(result.feedback, "sent");
  assert.equal(sent.length, 1);
  assert.doesNotMatch(
    JSON.stringify(sent),
    /private-voice-reference|private-pairing-nonce/,
  );
  assert.deepEqual(f.store.getKnowledge(), []);
});

test("wrong reply targets receive a correction without guessing which pending question to answer", async (t) => {
  const f = await fixture(t);
  const { handoff } = f.store.createHandoff({
    sessionId: "visitor-a",
    question: "A question",
  });
  f.store.markHandoffSent(handoff.id, 11, f.config.ownerChatId);
  let sends = 0;
  const fetchImpl: typeof fetch = async () => {
    sends += 1;
    return Response.json({
      ok: true,
      result: { message_id: 70, chat: { id: 123 } },
    });
  };
  const update = ownerUpdate(50, "Unmatched answer", 999);
  const result = await f.handleTelegramUpdate(update, { ...f, fetchImpl });
  assert.equal(result.reason, "wrong_target");
  assert.equal(result.feedback, "sent");
  assert.equal(
    (await f.handleTelegramUpdate(update, { ...f, fetchImpl })).status,
    "duplicate",
  );
  assert.equal(sends, 1);
  assert.equal(f.store.getHandoff(handoff.id, "visitor-a")?.status, "pending");
  assert.deepEqual(f.store.getKnowledge(), []);
});

test("public, private, and skipped owner replies receive the appropriate receipt exactly once", async (t) => {
  const f = await fixture(t);
  const sent: string[] = [];
  const fetchImpl: typeof fetch = async (_url, init) => {
    const payload = JSON.parse(String(init?.body)) as {
      chat_id: string;
      text: string;
    };
    assert.equal(payload.chat_id, f.config.ownerChatId);
    sent.push(payload.text);
    return Response.json({
      ok: true,
      result: { message_id: 70 + sent.length, chat: { id: 123 } },
    });
  };
  const cases = [
    {
      text: "Mark enjoys photography.",
      status: "answered",
      receipt: "Answered the visitor and saved your reply as public knowledge.",
    },
    {
      text: "/private Please contact Mark directly.",
      status: "answered",
      receipt:
        "Answered the visitor privately. Nothing was added to public knowledge.",
    },
    {
      text: "/skip",
      status: "skipped",
      receipt: "Question closed without publishing.",
    },
  ];
  for (const [index, item] of cases.entries()) {
    const { handoff } = f.store.createHandoff({
      sessionId: `visitor-${index}`,
      question: `Question ${index}`,
    });
    f.store.markHandoffSent(handoff.id, 11 + index, f.config.ownerChatId);
    const update = ownerUpdate(60 + index, item.text, 11 + index);
    const result = await f.handleTelegramUpdate(update, { ...f, fetchImpl });
    assert.equal(result.status, item.status);
    assert.equal(result.feedback, "sent");
    assert.equal(sent[index], item.receipt);
    assert.equal(
      (await f.handleTelegramUpdate(update, { ...f, fetchImpl })).status,
      "duplicate",
    );
  }
  assert.equal(sent.length, 3);
  assert.equal(f.store.getKnowledge().length, 1);
});

test("a failed receipt does not roll back the committed answer or resend on update replay", async (t) => {
  const f = await fixture(t);
  const { handoff } = f.store.createHandoff({
    sessionId: "visitor-a",
    question: "A question",
  });
  f.store.markHandoffSent(handoff.id, 11, f.config.ownerChatId);
  let calls = 0;
  const fetchImpl: typeof fetch = async () => {
    calls += 1;
    throw new Error("Unconfirmed delivery with a private provider body");
  };
  const update = ownerUpdate(90, "Mark enjoys exploring new cities.");
  const result = await f.handleTelegramUpdate(update, { ...f, fetchImpl });
  assert.equal(result.status, "answered");
  assert.equal(result.feedback, "failed");
  assert.doesNotMatch(JSON.stringify(result), /private provider body/);
  assert.equal(f.store.getHandoff(handoff.id, "visitor-a")?.status, "answered");
  assert.equal(f.store.getKnowledge().length, 1);
  assert.equal(
    (await f.handleTelegramUpdate(update, { ...f, fetchImpl })).status,
    "duplicate",
  );
  assert.equal(calls, 1);
  assert.equal(f.store.getKnowledge().length, 1);
  assert.equal(f.store.getHistory("visitor-a").length, 1);
});
