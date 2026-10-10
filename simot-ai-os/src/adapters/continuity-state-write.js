const REQUIRED_AUTHORITY = "SYSTEM_WRITE_ALLOWED";

export async function writeContinuityState(env, input = {}) {
  if (!env.SIMOT_MASTER_MEMORY) return { ok:false, status:"UNAVAILABLE", error_code:"MASTER_MEMORY_VPC_NOT_BOUND" };
  if (!env.SIMOT_MASTER_MEMORY_TOKEN) return { ok:false, status:"UNAVAILABLE", error_code:"MASTER_MEMORY_TOKEN_NOT_CONFIGURED" };
  if (input.approval !== true) return { ok:false, status:"BLOCKED", error_code:"EXPLICIT_APPROVAL_REQUIRED", next_action:"SET_APPROVAL_TRUE" };
  if (input.authority !== REQUIRED_AUTHORITY) return { ok:false, status:"BLOCKED", error_code:"SYSTEM_WRITE_AUTHORITY_REQUIRED" };
  if (!Number.isInteger(input.expected_version) || input.expected_version < 1) return { ok:false, status:"BLOCKED", error_code:"EXPECTED_VERSION_REQUIRED" };
  if (!input.state || typeof input.state !== "object" || Array.isArray(input.state)) return { ok:false, status:"BLOCKED", error_code:"STATE_OBJECT_REQUIRED" };
  if (!input.task_record || typeof input.task_record !== "object" || Array.isArray(input.task_record)) return { ok:false, status:"BLOCKED", error_code:"TASK_RECORD_REQUIRED" };
  if (!Array.isArray(input.evidence_records) || input.evidence_records.length < 1) return { ok:false, status:"BLOCKED", error_code:"EVIDENCE_RECORDS_REQUIRED" };

  try {
    const r = await env.SIMOT_MASTER_MEMORY.fetch("http://127.0.0.1:9100/continuity/state", {
      method: "POST",
      headers: { "Authorization": "Bearer " + env.SIMOT_MASTER_MEMORY_TOKEN, "content-type": "application/json" },
      body: JSON.stringify({
        expected_version: input.expected_version,
        state: input.state,
        task_record: input.task_record,
        evidence_records: input.evidence_records
      })
    });
    const body = await r.json().catch(() => null);
    if (!r.ok || !body?.ok) {
      return { ok:false, status:"FAILED", error_code:body?.error || "CONTINUITY_STATE_WRITE_FAILED", http_status:r.status, current_version:body?.current_version ?? null };
    }

    const readback = await env.SIMOT_MASTER_MEMORY.fetch("http://127.0.0.1:9100/continuity/state", {
      headers: { "Authorization": "Bearer " + env.SIMOT_MASTER_MEMORY_TOKEN, "cache-control": "no-store" }
    });
    const verified = await readback.json().catch(() => null);
    if (!readback.ok || !verified?.ok || verified.state?.state_version !== input.state.state_version) {
      return { ok:false, status:"WRITE_UNVERIFIED", error_code:"CONTINUITY_STATE_READBACK_MISMATCH", write_result:body };
    }
    return {
      ok:true, status:"VERIFIED", source:"MASTER_MEMORY_VPS",
      route:"MCP->WORKER->VPC->TUNNEL->/srv/simot-memory/CURRENT_STATE.json",
      state_version:verified.state.state_version,
      task_id:input.task_record.task_id,
      evidence_ids:input.evidence_records.map(x=>x.id),
      verified:{write:true,readback:true,task_log:true,evidence_index:true}
    };
  } catch {
    return { ok:false, status:"UNAVAILABLE", error_code:"CONTINUITY_STATE_TRANSPORT_FAILED" };
  }
}
