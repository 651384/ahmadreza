import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.js";

function makeDb() {
  const idempotency = new Map();
  const events = [];

  return {
    idempotency,
    events,
    async batch(statements) {
      for (const statement of statements) await statement.run();
      return {};
    },
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (sql.includes("SELECT msg_id,result_status FROM idempotency") || sql.includes("SELECT msg_id, result_status FROM idempotency")) {
                const row = idempotency.get(args[0]);
                return row ? { msg_id: args[0], result_status: row.result_status } : null;
              }
              return null;
            },
            async run() {
              if (sql.startsWith("INSERT INTO idempotency")) {
                idempotency.set(args[0], {
                  msg_id: args[0],
                  first_seen_at: args[1],
                  result_status: args[2],
                  corr_id: args[3]
                });
              } else if (sql.startsWith("UPDATE idempotency SET result_status")) {
                const row = idempotency.get(args[1]);
                if (row) row.result_status = args[0];
              } else if (sql.startsWith("INSERT INTO events")) {
                events.push({
                  id: args[0],
                  msg_id: args[1],
                  corr_id: args[2],
                  type: args[3],
                  status: args[4]
                });
              }
              return {};
            }
          };
        }
      };
    }
  };
}

function makeEnv({ secret = undefined } = {}) {
  const db = makeDb();
  const sent = [];
  const env = {
    SIMOT_DB: db,
    SIMOT_QUEUE: {
      async send(body) {
        sent.push(body);
      }
    },
    SIMOT_DEFAULT_STATE: "MANUAL",
    SIMOT_EXECUTION_STANDARD_VERSION: "2.1.0",
    SIMOT_TEST_MODE: "1"
  };
  if (secret !== undefined) env.TELEGRAM_WEBHOOK_SECRET = secret;
  return { env, db, sent };
}

function telegramRequest(body, secret) {
  return new Request("https://example.test/telegram/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(secret !== undefined ? { "X-Telegram-Bot-Api-Secret-Token": secret } : {})
    },
    body: JSON.stringify(body)
  });
}

const validUpdate = {
  update_id: 9001,
  message: {
    message_id: 1,
    chat: { id: 123 },
    from: { id: 456 },
    text: "hello SIMOT"
  }
};

test("Telegram webhook fails closed when secret is not configured", async () => {
  const { env } = makeEnv();
  const response = await worker.fetch(telegramRequest(validUpdate, "anything"), env);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: "TELEGRAM_WEBHOOK_NOT_CONFIGURED",
    state: "MANUAL"
  });
});

test("Telegram webhook rejects a missing or wrong secret", async () => {
  const { env } = makeEnv({ secret: "expected-secret" });
  const missing = await worker.fetch(telegramRequest(validUpdate), env);
  assert.equal(missing.status, 401);
  const wrong = await worker.fetch(telegramRequest(validUpdate, "wrong-secret"), env);
  assert.equal(wrong.status, 401);
  assert.deepEqual(await wrong.json(), {
    ok: false,
    error: "TELEGRAM_WEBHOOK_UNAUTHORIZED"
  });
});

test("Telegram webhook rejects malformed JSON and invalid updates", async () => {
  const { env } = makeEnv({ secret: "expected-secret" });
  const malformed = new Request("https://example.test/telegram/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Telegram-Bot-Api-Secret-Token": "expected-secret"
    },
    body: "{"
  });
  const malformedResponse = await worker.fetch(malformed, env);
  assert.equal(malformedResponse.status, 400);
  assert.deepEqual(await malformedResponse.json(), {
    ok: false,
    error: "INVALID_JSON"
  });
  const invalid = await worker.fetch(telegramRequest({ update_id: 9002 }, "expected-secret"), env);
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), {
    ok: false,
    error: "UNSUPPORTED_TELEGRAM_UPDATE"
  });
});

test("valid Telegram update is queued exactly once and duplicate is idempotent", async () => {
  const { env, db, sent } = makeEnv({ secret: "expected-secret" });
  const first = await worker.fetch(telegramRequest(validUpdate, "expected-secret"), env);
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), {
    ok: true,
    accepted: true,
    channel: "TELEGRAM",
    msg_id: "TG-9001",
    corr_id: "TG-9001",
    status: "QUEUED"
  });
  assert.equal(sent.length, 1);
  assert.equal(sent[0]["MSG-ID"], "TG-9001");
  assert.equal(db.idempotency.get("TG-9001").result_status, "QUEUED");
  const duplicate = await worker.fetch(telegramRequest(validUpdate, "expected-secret"), env);
  assert.equal(duplicate.status, 200);
  assert.deepEqual(await duplicate.json(), {
    ok: true,
    duplicate: true,
    msg_id: "TG-9001",
    result_status: "QUEUED"
  });
  assert.equal(sent.length, 1);
});
