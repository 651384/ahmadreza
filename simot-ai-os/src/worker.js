const VERSION = "0.1.0";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function now() { return new Date().toISOString(); }

function validateEnvelope(body) {
  if (!body || typeof body !== "object") return "INVALID_BODY";
  const required = ["MSG-ID", "FROM", "TO", "TYPE", "AUTHORITY"];
  for (const k of required) if (!body[k]) return "MISSING_" + k;
  if (body["TO"] !== "SIMOT-MASTER" && !String(body["TO"]).startsWith("SIMOT-AI-")) return "WRONG_RECIPIENT";
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({service:"simot-ai-os-gateway", version:VERSION, state:env.SIMOT_DEFAULT_STATE || "MANUAL", time:now()});
    }
    if (url.pathname === "/webhook" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch { return json({ok:false,error:"INVALID_JSON"},400); }
      const err = validateEnvelope(body);
      if (err) return json({ok:false,error:err},400);
      const msgId = body["MSG-ID"];
      const existing = await env.SIMOT_DB.prepare("SELECT msg_id FROM idempotency WHERE msg_id = ?").bind(msgId).first();
      if (existing) return json({ok:true,duplicate:true,msg_id:msgId});
      const t = now();
      await env.SIMOT_DB.prepare("INSERT INTO idempotency(msg_id,first_seen_at,result_status) VALUES(?,?,?)").bind(msgId,t,"ACCEPTED").run();
      const event = {id:crypto.randomUUID(), msg_id:msgId, corr_id:body["CORR-ID"] || null, type:body["TYPE"], status:"ACCEPTED", created_at:t, payload_json:JSON.stringify(body)};
      await env.SIMOT_DB.prepare("INSERT INTO events(id,msg_id,corr_id,type,status,created_at,updated_at,payload_json) VALUES(?,?,?,?,?,?,?,?)").bind(event.id,event.msg_id,event.corr_id,event.type,event.status,t,t,event.payload_json).run();
      await env.SIMOT_QUEUE.send(body);
      return json({ok:true,accepted:true,msg_id:msgId});
    }
    return json({ok:false,error:"NOT_FOUND"},404);
  },
  async queue(batch, env) {
    for (const message of batch.messages) {
      // Provider execution is intentionally not hard-coded here.
      // Router integration follows after free-provider credentials are configured.
      message.ack();
    }
  }
};
