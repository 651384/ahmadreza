import { exaSearch } from "./adapters/exa.js";
import { submitJarvisMessage, readJarvisMailbox } from "./jarvis-bridge.js";
import { executeToolRequest } from "./tool-execution-bridge.js";
import { writeCloudflareMasterMemorySecret } from "./adapters/cloudflare-secrets-write.js";
const PROTOCOL_VERSION = "2025-11-25";
const MODERN_PROTOCOL_VERSION = "2026-07-28";

function response(body, status = 200, headers = {}) {
  return new Response(body == null ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
  });
}
function rpcResult(id, result) { return response({ jsonrpc: "2.0", id, result }); }
function rpcError(id, code, message) { return response({ jsonrpc: "2.0", id, error: { code, message } }, 200); }

const TOOLS = [
  { name: "simot_health", description: "Read SIMOT AI OS runtime health.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "simot_tasks_status", description: "Read autonomous task counts and task state from SIMOT D1.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "simot_workers_status", description: "Read registered SIMOT worker runtime status.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "simot_watchdog_status", description: "Read legacy watchdog status for compatibility only; SIMOT core does not run a watchdog.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "simot_jarvis_send", description: "Submit a user request from Jarvis into the SIMOT execution queue.", inputSchema: { type: "object", properties: { message: { type: "string", minLength: 1, maxLength: 12000 }, msg_id: { type: "string", maxLength: 128 }, corr_id: { type: "string", maxLength: 128 } }, required: ["message"], additionalProperties: false } },
  { name: "simot_mailbox_read", description: "Read recent SIMOT Jarvis bridge messages without secrets.", inputSchema: { type: "object", properties: { since: { type: "string", maxLength: 64 }, limit: { type: "integer", minimum: 1, maximum: 50 }, direction: { type: "string", enum: ["JARVIS_TO_SIMOT","SIMOT_TO_JARVIS"] } }, additionalProperties: false } },
  { name: "simot_exa_search", description: "Run public-web research through Exa.", inputSchema: { type: "object", properties: { query: { type: "string", minLength: 1, maxLength: 500 }, numResults: { type: "integer", minimum: 1, maximum: 10 } }, required: ["query"], additionalProperties: false } },
  { name: "simot_tool_execute", description: "Execute a bounded SIMOT runtime tool operation. Defaults to READ and fails closed for unsupported connectors or writes.", inputSchema: { type: "object", properties: { tool_ref: { type: "string", minLength: 1, maxLength: 128 }, operation: { type: "string", minLength: 1, maxLength: 128 }, mode: { type: "string", enum: ["READ", "WRITE", "EXECUTE"] }, authority: { type: "string", enum: ["INFORMATIONAL", "ANALYSIS_ONLY", "EXECUTE_WITHIN_ROLE", "APPROVAL_REQUIRED", "HUMAN_ONLY", "SYSTEM_WRITE_ALLOWED"] }, args: { type: "object" } }, required: ["tool_ref", "operation"], additionalProperties: false } }
];

async function toolCall(name, args, env) {
  if (name === "simot_health") return { service: "simot-ai-os-gateway", version: env.SIMOT_RUNTIME_VERSION || "unknown", state: env.SIMOT_DEFAULT_STATE || "MANUAL", controller_mode: env.SIMOT_CONTROLLER_MODE || "EXTERNAL" };
  if (name === "simot_tasks_status") {
    const rows = await env.SIMOT_DB.prepare("SELECT status,COUNT(*) AS count FROM autonomous_tasks GROUP BY status").all();
    return { summary: rows.results || [] };
  }
  if (name === "simot_workers_status") {
    const rows = await env.SIMOT_DB.prepare("SELECT worker_id,status,last_run_at,last_msg_id FROM worker_registry ORDER BY worker_id").all();
    return { workers: rows.results || [] };
  }
  if (name === "simot_watchdog_status") {
    const heartbeat = await env.SIMOT_DB.prepare("SELECT id,status,instance_id,last_heartbeat_at,current_operation,state_version FROM controller_heartbeat WHERE id=1").first().catch(() => null);
    const state = await env.SIMOT_DB.prepare("SELECT checked_at,state,action,controller_status,age_ms,reason FROM watchdog_state WHERE id=1").first().catch(() => null);
    return { compatibility_only: true, heartbeat: heartbeat || null, watchdog: state || null };
  }
  if (name === "simot_jarvis_send") return await submitJarvisMessage(env, args?.message, { msgId: args?.msg_id, corrId: args?.corr_id });
  if (name === "simot_mailbox_read") return await readJarvisMailbox(env, { since: args?.since, limit: args?.limit, direction: args?.direction });
  if (name === "simot_exa_search") {
    const result = await exaSearch(env, args || {});
    return { provider: result.provider, status: result.status, result };
  }
  if (name === "simot_tool_execute") {
    if (
      String(args?.tool_ref || "").toUpperCase() === "CLOUDFLARE" &&
      String(args?.operation || "").toUpperCase() === "UPDATE_MASTER_MEMORY_TOKEN"
    ) {
      if (String(args?.mode || "").toUpperCase() !== "WRITE") {
        return {
          ok: false,
          status: "BLOCKED",
          error_code: "WRITE_MODE_REQUIRED",
          next_action: "SET_MODE_WRITE"
        };
      }

      return await writeCloudflareMasterMemorySecret(env, {
        authority: args?.authority,
        approval: args?.args?.approval === true,
        script_name: args?.args?.script_name,
        secret_name: args?.args?.secret_name,
        secret_value: args?.args?.secret_value
      });
    }

    return await executeToolRequest(env, args || {});
  }
  throw new Error("UNKNOWN_TOOL");
}

export async function handleMcpRequest(request, env) {
  if (request.method !== "POST") return response({ ok: false, error: "MCP_POST_REQUIRED" }, 405, { allow: "POST, OPTIONS" });
  let body;
  try { body = await request.json(); } catch { return rpcError(null, -32700, "Parse error"); }
  const id = body?.id ?? null;
  const method = body?.method;
  if (!method) return rpcError(id, -32600, "Invalid Request");

  if (method === "server/discover") return rpcResult(id, {
    supportedVersions: [MODERN_PROTOCOL_VERSION, PROTOCOL_VERSION],
    capabilities: { tools: {} },
    serverInfo: { name: "simot-ai-os", version: env.SIMOT_RUNTIME_VERSION || "0.5.0" },
    instructions: "SIMOT control-plane MCP gateway. Tool execution is bounded, read-first, fail-closed, and must never claim external execution without explicit adapter evidence.",
    ttlMs: 60000,
    cacheScope: "public"
  });
  if (method === "initialize") return rpcResult(id, { protocolVersion: PROTOCOL_VERSION, capabilities: { tools: {} }, serverInfo: { name: "simot-ai-os", version: env.SIMOT_RUNTIME_VERSION || "0.5.0" } });
  if (method === "notifications/initialized") return new Response(null, { status: 202 });
  if (method === "ping") return rpcResult(id, {});
  if (method === "tools/list") return rpcResult(id, { tools: TOOLS });

  if (method === "tools/call") {
    const name = body?.params?.name;
    try {
      const result = await toolCall(name, body?.params?.arguments || {}, env);
      return rpcResult(id, { content: [{ type: "text", text: JSON.stringify(result) }], isError: result?.ok === false && result?.status === "BLOCKED" });
    } catch (error) {
      return rpcResult(id, { content: [{ type: "text", text: JSON.stringify({ error: error?.message || "TOOL_FAILED" }) }], isError: true });
    }
  }
  return rpcError(id, -32601, "Method not found");
}
