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
