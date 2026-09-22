import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTelegramUpdate, buildTelegramMessage } from "../src/adapters/telegram.js";

test("normalizes a Telegram text message without transport/auth logic", () => {
  const result = normalizeTelegramUpdate({
    update_id: 101,
    message: {
      message_id: 7,
      chat: { id: 12345 },
      from: { id: 67890 },
      text: "hello SIMOT"
    }
  });

  assert.deepEqual(result, {
    channel: "TELEGRAM",
    update_type: "message",
    external_update_id: "101",
    chat_id: "12345",
    sender_id: "67890",
    text: "hello SIMOT",
    raw: {
      update_id: 101,
      message: {
        message_id: 7,
        chat: { id: 12345 },
        from: { id: 67890 },
        text: "hello SIMOT"
      }
    }
  });
});

test("normalizes edited messages, channel posts and callback queries", () => {
  assert.equal(
    normalizeTelegramUpdate({
      update_id: 1,
      edited_message: { chat: { id: 1 }, from: { id: 2 }, text: "edit" }
    }).update_type,
    "edited_message"
  );

  assert.equal(
    normalizeTelegramUpdate({
      update_id: 2,
      channel_post: { chat: { id: -1 }, text: "post" }
    }).update_type,
    "channel_post"
  );

  const callback = normalizeTelegramUpdate({
    update_id: 3,
    callback_query: {
      id: "cb-1",
      from: { id: 9 },
      message: { chat: { id: 8 }, text: "button" }
    }
  });

  assert.equal(callback.update_type, "callback_query");
  assert.equal(callback.chat_id, "8");
  assert.equal(callback.sender_id, "9");
  assert.equal(callback.text, "button");
});

test("uses caption when a Telegram message has no text", () => {
  const result = normalizeTelegramUpdate({
    update_id: 4,
    message: {
      chat: { id: 10 },
      from: { id: 11 },
      caption: "caption input"
    }
  });

  assert.equal(result.text, "caption input");
});

test("rejects invalid and unsupported Telegram updates", () => {
  assert.throws(
    () => normalizeTelegramUpdate(null),
    (error) => error.message === "INVALID_TELEGRAM_UPDATE"
  );

  assert.throws(
    () => normalizeTelegramUpdate({ update_id: 5 }),
    (error) => error.message === "UNSUPPORTED_TELEGRAM_UPDATE"
  );
});

test("builds a provider-neutral outbound Telegram sendMessage shape", () => {
  assert.deepEqual(
    buildTelegramMessage({ chatId: 123, text: "SIMOT response" }),
    {
      method: "sendMessage",
      body: {
        chat_id: "123",
        text: "SIMOT response"
      }
    }
  );
});

test("rejects incomplete outbound Telegram messages", () => {
  assert.throws(
    () => buildTelegramMessage({ chatId: "", text: "x" }),
    (error) => error.message === "MISSING_CHAT_ID"
  );

  assert.throws(
    () => buildTelegramMessage({ chatId: 1, text: "" }),
    (error) => error.message === "MISSING_TEXT"
  );
});

test("builds a controlled SIMOT-MSG envelope from normalized Telegram input", async () => {
  const normalized = normalizeTelegramUpdate({
    update_id: 101,
    message: {
      chat: { id: 12345 },
      from: { id: 67890 },
      text: "hello SIMOT"
    }
  });

  const { buildTelegramEnvelope } = await import("../src/adapters/telegram.js");
  const envelope = buildTelegramEnvelope(normalized, {
    msgId: "TG-101",
    corrId: "TG-101",
    threadId: "TG-101"
  });

  assert.equal(envelope["FRAME-START"], "<<<SIMOT-MSG v2 | START>>>");
  assert.equal(envelope["FRAME-END"], "<<<SIMOT-MSG v2 | END | MSG-ID=TG-101>>>");
  assert.equal(envelope["FROM"], "SIMOT-AI-01");
  assert.equal(envelope["TO"], "SIMOT-MASTER");
  assert.equal(envelope["TYPE"], "REQUEST");
  assert.deepEqual(envelope.PAYLOAD, {
    channel: "TELEGRAM",
    update_type: "message",
    external_update_id: "101",
    chat_id: "12345",
    sender_id: "67890",
    text: "hello SIMOT"
  });
});
