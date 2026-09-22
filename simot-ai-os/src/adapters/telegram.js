const TELEGRAM_UPDATE_TYPES = new Set(["message","edited_message","channel_post","edited_channel_post","callback_query"]);

function textOfMessage(message) {
  if (!message || typeof message !== "object") return null;
  if (typeof message.text === "string" && message.text.length) return message.text;
  if (message.caption && typeof message.caption === "string") return message.caption;
  return null;
}

export function normalizeTelegramUpdate(update) {
  if (!update || typeof update !== "object" || Array.isArray(update)) {
    throw new Error("INVALID_TELEGRAM_UPDATE");
  }

  const updateType =
    update.message ? "message" :
    update.edited_message ? "edited_message" :
    update.channel_post ? "channel_post" :
    update.edited_channel_post ? "edited_channel_post" :
    update.callback_query ? "callback_query" :
    null;

  if (!updateType || !TELEGRAM_UPDATE_TYPES.has(updateType)) {
    throw new Error("UNSUPPORTED_TELEGRAM_UPDATE");
  }

  const source = update[updateType];
  const message = source?.message || source;
  const text = textOfMessage(message);

  return {
    channel: "TELEGRAM",
    update_type: updateType,
    external_update_id: String(update.update_id ?? ""),
    chat_id: message?.chat?.id != null ? String(message.chat.id) : null,
    sender_id: message?.from?.id != null ? String(message.from.id) : null,
    text,
    raw: update
  };
}

export function buildTelegramEnvelope(normalized, { msgId, corrId = msgId, threadId = msgId } = {}) {
  if (!normalized || normalized.channel !== "TELEGRAM") throw new Error("INVALID_TELEGRAM_NORMALIZED");
  if (!msgId) throw new Error("MISSING_MSG_ID");

  return {
    "FRAME-START": "<<<SIMOT-MSG v2 | START>>>",
    "FRAME-END": `<<<SIMOT-MSG v2 | END | MSG-ID=${msgId}>>>`,
    "MSG-ID": String(msgId),
    "CORR-ID": String(corrId),
    "REPLY-TO": "NONE",
    "THREAD-ID": String(threadId),
    "FROM": "SIMOT-AI-01",
    "TO": "SIMOT-MASTER",
    "TYPE": "REQUEST",
    "PRIORITY": "IMPORTANT",
    "AUTHORITY": "INFORMATIONAL",
    "STATUS": "NEW",
    "SCOPE": "TELEGRAM_CHANNEL_INPUT",
    "SOT-REFS": "TELEGRAM",
    "TASK-REFS": "NONE",
    "RECORD-REFS": "NONE",
    "EXPECTED-ACTION": "RESEARCH_OR_ROUTING",
    "DEADLINE": "NONE",
    "CONFIDENTIALITY": "INTERNAL",
    "PAYLOAD-FORMAT": "JSON",
    "PART": "1/1",
    "RESULT-STATUS": "PENDING",
    "NEXT-ACTION": "ROUTE_TO_MASTER",
    "WRITE-BACK": "REQUIRED",
    "ESCALATION": "NONE",
    "CONFIDENCE": "VERIFIED",
    "VERIFICATION": "INTERNAL",
    PAYLOAD: {
      channel: normalized.channel,
      update_type: normalized.update_type,
      external_update_id: normalized.external_update_id,
      chat_id: normalized.chat_id,
      sender_id: normalized.sender_id,
      text: normalized.text
    }
  };
}

export function buildTelegramMessage({ chatId, text }) {
  if (chatId == null || chatId === "") throw new Error("MISSING_CHAT_ID");
  if (typeof text !== "string" || !text.length) throw new Error("MISSING_TEXT");

  return {
    method: "sendMessage",
    body: {
      chat_id: String(chatId),
      text
    }
  };
}

// Transport/authentication and Bot API invocation are intentionally outside
// this module. No bot token, secret, or provider execution is stored here.
