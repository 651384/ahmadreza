const VERSION = "0.2.0";
const RECIPIENT_RE = /^(SIMOT-MASTER|SIMOT-AI-[0-9]{2})$/;
const TYPES = new Set(["COMMAND","REQUEST","RESPONSE","HANDOFF","ACK","STATUS","RESULT","ESCALATION","CLARIFICATION","REJECTION","ERROR","CANCEL","UPDATE","DECISION_REQUEST","DECISION"]);
const PRIORITIES = new Set(["ROUTINE","IMPORTANT","URGENT","CRITICAL"]);
const AUTHORITIES = new Set(["INFORMATIONAL","ANALYSIS_ONLY","EXECUTE_WITHIN_ROLE","APPROVAL_REQUIRED","HUMAN_ONLY","SYSTEM_WRITE_ALLOWED"]);
const STATUSES = new Set(["NEW","PENDING","RECEIVED","ACCEPTED_FOR_EXECUTION","IN_PROGRESS","COMPLETED","BLOCKED","WAITING","REJECTED","FAILED","CANCELLED","UNKNOWN"]);
const CONFIDENTIALITY = new Set(["INTERNAL","CONFIDENTIAL","RESTRICTED"]);
const PAYLOAD_FORMATS = new Set(["TEXT","TABLE","JSON","DOCUMENT","MIXED"]);
const VERIFICATION = new Set(["VERIFIED","INTERNAL","SECONDARY","UNVERIFIED","AI-INFERRED","SUPERSEDED","REJECTED"]);
const RESULT_STATUSES = new Set(["PENDING","COMPLETED","BLOCKED","FAILED","REJECTED","CANCELLED","UNKNOWN"]);
const WRITE_BACK = new Set(["COMPLETED","REQUIRED","NOT-APPLICABLE","FAILED"]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function now() { return new Date().toISOString(); }

function validateEnvelope(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "INVALID_BODY";

  const required = [
    "MSG-ID","CORR-ID","REPLY-TO","THREAD-ID","FROM","TO","TYPE","PRIORITY","AUTHORITY",
    "STATUS","SCOPE","SOT-REFS","TASK-REFS","RECORD-REFS","EXPECTED-ACTION","DEADLINE",
    "CONFIDENTIALITY","PAYLOAD-FORMAT","PART","RESULT-STATUS","NEXT-ACTION","WRITE-BACK",
    "ESCALATION","CONFIDENCE","VERIFICATION"
  ];
  for (const k of required) {
    if (body[k] === undefined || body[k] === null || body[k] === "") return "MISSING_" + k;
  }

  if (!RECIPIENT_RE.test(String(body["TO"]))) return "WRONG_RECIPIENT";
  if (body["TO"] === "SIMOT-MASTER" && body["FROM"] !== "SIMOT-AI-01" && !/^SIMOT-AI-[0-9]{2}$/.test(String(body["FROM"]))) return "INVALID_SENDER_FOR_MASTER";
  if (/^SIMOT-AI-[0-9]{2}$/.test(String(body["TO"])) && body["FROM"] !== "SIMOT-MASTER") return "INVALID_SENDER_FOR_WORKER";
  if (!TYPES.has(body["TYPE"])) return "INVALID_TYPE";
  if (!PRIORITIES.has(body["PRIORITY"])) return "INVALID_PRIORITY";
  if (!AUTHORITIES.has(body["AUTHORITY"])) return "INVALID_AUTHORITY";
  if (!STATUSES.has(body["STATUS"])) return "INVALID_STATUS";
  if (!CONFIDENTIALITY.has(body["CONFIDENTIALITY"])) return "INVALID_CONFIDENTIALITY";
  if (!PAYLOAD_FORMATS.has(body["PAYLOAD-FORMAT"])) return "INVALID_PAYLOAD_FORMAT";
  if (!RESULT_STATUSES.has(body["RESULT-STATUS"])) return "INVALID_RESULT_STATUS";
  if (!WRITE_BACK.has(body["WRITE-BACK"])) return "INVALID_WRITE_BACK";
  if (!VERIFICATION.has(body["VERIFICATION"])) return "INVALID_VERIFICATION";
  if (typeof body["PART"] !== "string" || !/^\d+\/\d+$/.test(body["PART"])) return "INVALID_PART";

  const [part, total] = body["PART"].split("/").map(Number);
  if (!Number.isInteger(part) || !Number.isInteger(total) || total < 1 || part < 1 || part > total) return "INVALID_PART";

  if (body["REPLY-TO"] !== "NONE" && typeof body["REPLY-TO"] !== "string") return "INVALID_REPLY_TO";
  if (body["SCOPE"] && String(body["SCOPE"]).length > 4000) return "SCOPE_TOO_LARGE";

  return null;
}

function parseFrame(body) {
  if (!body || typeof body !== "object") return { error: "INVALID_BODY" };
  if (body["FRAME-START"] !== "<<<SIMOT-MSG v2 | START>>>") return { error: "INVALID_FRAME_START" };
  if (body["FRAME-END"] !== "<<<SIMOT-MSG v2 | END | MSG-ID=" + body["MSG-ID"] + ">>>") return { error: "INVALID_FRAME_END" };
  return { error: null };
}

function safeBody(body) {
  const copy = { ...body };
  if (copy.SECRET) delete copy.SECRET;
  if (copy["API-KEY"]) delete copy["API-KEY"];
  if (copy["PRIVATE-KEY"]) delete copy["PRIVATE-KEY"];
  if (copy.PASSWORD) delete copy.PASSWORD;
  return copy;
}

async function recordEvent(env, event) {
  await env.SIMOT_DB.prepare(
    "INSERT INTO events(id,msg_id,corr_id,type,status,created_at,updated_at,payload_json,error_code,error_message) VALUES(?,?,?,?,?,?,?,?,?,?)"
  ).bind(
    event.id, event.msg_id, event.corr_id, event.type, event.status,
    event.created_at, event.updated_at, event.payload_json || null,
    event.error_code || null, event.error_message || null
  ).run();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({
        service: "simot-ai-os-gateway",
        version: VERSION,
        state: env.SIMOT_DEFAULT_STATE || "MANUAL",
        time: now()
      });
    }

    if (url.pathname === "/webhook" && request.method === "POST") {
      if (!env.SIMOT_DB || !env.SIMOT_QUEUE) {
        return json({ ok: false, error: "RUNTIME_NOT_CONFIGURED", state: "MANUAL" }, 503);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: "INVALID_JSON" }, 400);
      }

      const frameError = parseFrame(body);
      if (frameError.error) return json({ ok: false, error: frameError.error }, 400);

      const envelopeError = validateEnvelope(body);
      if (envelopeError) return json({ ok: false, error: envelopeError }, 400);

      const msgId = body["MSG-ID"];
      const existing = await env.SIMOT_DB.prepare(
        "SELECT msg_id, result_status FROM idempotency WHERE msg_id = ?"
      ).bind(msgId).first();

      if (existing) {
        return json({
          ok: true,
          duplicate: true,
          msg_id: msgId,
          result_status: existing.result_status
        });
      }

      const t = now();
      try {
        await env.SIMOT_DB.prepare(
          "INSERT INTO idempotency(msg_id,first_seen_at,result_status,corr_id) VALUES(?,?,?,?)"
        ).bind(msgId, t, "ACCEPTED_FOR_EXECUTION", body["CORR-ID"]).run();

        await recordEvent(env, {
          id: crypto.randomUUID(),
          msg_id: msgId,
          corr_id: body["CORR-ID"],
          type: body["TYPE"],
          status: "ACCEPTED_FOR_EXECUTION",
          created_at: t,
          updated_at: t,
          payload_json: JSON.stringify(safeBody(body))
        });

        await env.SIMOT_QUEUE.send(body);

        await env.SIMOT_DB.prepare(
          "UPDATE idempotency SET result_status = ? WHERE msg_id = ?"
        ).bind("QUEUED", msgId).run();

        return json({
          ok: true,
          accepted: true,
          msg_id: msgId,
          corr_id: body["CORR-ID"],
          status: "QUEUED"
        });
      } catch (error) {
        await env.SIMOT_DB.prepare(
          "UPDATE idempotency SET result_status = ? WHERE msg_id = ?"
        ).bind("FAILED", msgId).run().catch(() => {});

        return json({
          ok: false,
          error: "HANDOFF_FAILED",
          msg_id: msgId,
          corr_id: body["CORR-ID"]
        }, 503);
      }
    }

    return json({ ok: false, error: "NOT_FOUND" }, 404);
  },

  async queue(batch, env) {
    if (!env.SIMOT_DB) {
      throw new Error("RUNTIME_NOT_CONFIGURED");
    }

    for (const message of batch.messages) {
      const body = message.body || {};
      const msgId = body["MSG-ID"];
      const corrId = body["CORR-ID"] || null;
      const t = now();

      try {
        const frameError = parseFrame(body);
        if (frameError.error) {
          await recordEvent(env, {
            id: crypto.randomUUID(), msg_id: msgId || "UNKNOWN", corr_id: corrId,
            type: body["TYPE"] || "ERROR", status: "REJECTED",
            created_at: t, updated_at: t, payload_json: JSON.stringify(safeBody(body)),
            error_code: frameError.error, error_message: "SIMOT-MSG v2 framing validation failed"
          });
          message.ack();
          continue;
        }

        const err = validateEnvelope(body);
        if (err) {
          await recordEvent(env, {
            id: crypto.randomUUID(), msg_id: msgId || "UNKNOWN", corr_id: corrId,
            type: body["TYPE"] || "ERROR", status: "REJECTED",
            created_at: t, updated_at: t, payload_json: JSON.stringify(safeBody(body)),
            error_code: err, error_message: "SIMOT-MSG v2 validation failed"
          });
          message.ack();
          continue;
        }

        // Provider execution/router is intentionally not implemented in this foundation.
        // Do not claim completion. Record WAITING as recoverable state; ACK prevents endless queue retries until an execution handler exists.
        await recordEvent(env, {
          id: crypto.randomUUID(), msg_id: msgId, corr_id: corrId,
          type: body["TYPE"], status: "WAITING",
          created_at: t, updated_at: t, payload_json: JSON.stringify(safeBody(body)),
          error_code: "EXECUTION_HANDLER_NOT_CONFIGURED",
          error_message: "Provider/router execution is not configured; message remains recoverable."
        });

        await env.SIMOT_DB.prepare(
          "UPDATE idempotency SET result_status = ? WHERE msg_id = ?"
        ).bind("WAITING", msgId).run();

        message.ack();
      } catch (error) {
        await recordEvent(env, {
          id: crypto.randomUUID(), msg_id: msgId || "UNKNOWN", corr_id: corrId,
          type: body["TYPE"] || "ERROR", status: "FAILED",
          created_at: t, updated_at: t, payload_json: JSON.stringify(safeBody(body)),
          error_code: "QUEUE_PROCESSING_ERROR",
          error_message: String(error?.message || error)
        }).catch(() => {});

        message.retry();
      }
    }
  }
};
