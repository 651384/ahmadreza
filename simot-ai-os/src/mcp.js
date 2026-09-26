import { exaSearch } from "./adapters/exa.js";
const PROTOCOL_VERSION = "2025-11-25";
const MODERN_PROTOCOL_VERSION = "2026-07-28";

function response(body, status = 200, headers = {}) {
  return new Response(body == null ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
  });
}

function rpcResult(id, result) {
  return response({ jsonrpc: "2.0", id, result });
}

function rpcError(id, code, message) {
  return response({ jsonrpc: "2.0", id, error: { code, message } }, 200);
}

const TOOLS = [
  {
    name: "simot_health",
    description: "Read SIMOT AI OS runtime health and watchdog policy.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "simot_tasks_status",
    description: "Read autonomous task counts and task state from SIMOT D1.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "simot_workers_status",
    description: "Read registered SIMOT worker runtime status.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "simot_watchdog_status",
    description: "Read SIMOT cloud watchdog and heartbeat status.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "simot_exa_search",
    description: "Run a public-web research search through the configured Exa provider.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 1, maxLength: 500 },
        numResults: { type: "integer", minimum: 1, maximum: 10 }
      },
      required: ["query"],
      additionalProperties: false
    }
  }
];

async function toolCall(name, args, env) {
  if (name === "simot_health") {
    return {
      service: "simot-ai-os-gateway",
      version: env.SIMOT_RUNTIME_VERSION || "unknown",
      state: env.SIMOT_DEFAULT_STATE || "MANUAL",
      controller_mode: env.SIMOT_CONTROLLER_MODE || "EXTERNAL"
    };
  }
  if (name === "simot_tasks_status") {
    const rows = await env.SIMOT_DB.prepare(
      "SELECT status,COUNT(*) AS count FROM autonomous_tasks GROUP BY status"
    ).all();
    return { summary: rows.results || [] };
  }
  if (name === "simot_workers_status") {
    const rows = await env.SIMOT_DB.prepare(
      "SELECT worker_id,status,last_run_at,last_msg_id FROM worker_registry ORDER BY worker_id"
    ).all();
    return { workers: rows.results || [] };
  }
  if (name === "simot_watchdog_status") {
    const heartbeat = await env.SIMOT_DB.prepare(
      "SELECT id,status,instance_id,last_heartbeat_at,current_operation,state_version FROM controller_heartbeat WHERE id=1"
    ).first();
    const state = await env.SIMOT_DB.prepare(
      "SELECT checked_at,state,action,controller_status,age_ms,reason FROM watchdog_state WHERE id=1"
    ).first();
    return { heartbeat: heartbeat || null, watchdog: state || null };
  }
  if (name === "simot_exa_search") {
    const result = await exaSearch(env, args || {});
    return { provider: result.provider, status: result.status, result };
  }
  throw new Error("UNKNOWN_TOOL");
}

export async function handleMcpRequest(request, env) {
  if (request.method !== "POST") {
    return response({ ok: false, error: "MCP_POST_REQUIRED" }, 405, { allow: "POST, OPTIONS" });
  }
  let body;
  try { body = await request.json(); }
  catch { return rpcError(null, -32700, "Parse error"); }

  const id = body?.id ?? null;
  const method = body?.method;
  if (!method) return rpcError(id, -32600, "Invalid Request");

  if (method === "server/discover") {
    return rpcResult(id, {
      supportedVersions: [MODERN_PROTOCOL_VERSION, PROTOCOL_VERSION],
      capabilities: { tools: {} },
      serverInfo: { name: "simot-ai-os", version: env.SIMOT_RUNTIME_VERSION || "0.5.0" },
      instructions: "SIMOT read-only control-plane MCP gateway. Use tools to inspect SIMOT state; do not claim execution unless a tool returns explicit completion evidence.",
      ttlMs: 60000,
      cacheScope: "public"
    });
  }

  if (method === "initialize") {
    return rpcResult(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: "simot-ai-os", version: env.SIMOT_RUNTIME_VERSION || "0.5.0" }
    });
  }

  if (method === "notifications/initialized") {
    return new Response(null, { status: 202 });
  }

  if (method === "ping") return rpcResult(id, {});

  if (method === "tools/list") {
    return rpcResult(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const name = body?.params?.name;
    try {
      const result = await toolCall(name, body?.params?.arguments || {}, env);
      return rpcResult(id, { content: [{ type: "text", text: JSON.stringify(result) }], isError: false });
    } catch (error) {
      return rpcResult(id, {
        content: [{ type: "text", text: JSON.stringify({ error: error?.message || "TOOL_FAILED" }) }],
        isError: true
      });
    }
  }

  return rpcError(id, -32601, "Method not found");
}
