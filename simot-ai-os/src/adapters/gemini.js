const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

function modelName(env) {
  return String(env?.GEMINI_MODEL || "gemini-2.5-flash");
}

function agentName(env) {
  return String(env?.GEMINI_AGENT || "antigravity-preview-09-2026");
}

async function geminiAgent(env, { prompt, previousInteractionId = null, background = false } = {}) {
  if (!env?.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");
  if (!prompt || typeof prompt !== "string") throw new Error("GEMINI_PROMPT_REQUIRED");

  const body = {
    agent: agentName(env),
    input: prompt.slice(0, Number(env.GEMINI_AGENT_MAX_INPUT_CHARS || 6000)),
    environment: "remote",
    tools: [{
      type: "mcp_server",
      name: "simot_mcp",
      url: "https://simot-ai-os-gateway.vahid-ahmadreza.workers.dev/mcp"
    }]
  };

  if (previousInteractionId) body.previous_interaction_id = previousInteractionId;
  if (background) body.background = true;

  const response = await fetch(GEMINI_INTERACTIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      ok: false,
      provider: "GOOGLE_GEMINI",
      status: "FAILED",
      http_status: response.status,
      agent: body.agent,
      error: payload?.error?.message || "GEMINI_INTERACTION_FAILED"
    };
  }

  const stepText = Array.isArray(payload?.steps)
    ? payload.steps
        .filter(step => step?.type === "model_output")
        .flatMap(step => Array.isArray(step?.content) ? step.content.map(part => part?.text || "") : [])
        .join("")
    : "";
  const outputText =
    payload?.output_text ||
    payload?.outputs?.map(x => x?.text || "").join("") ||
    payload?.output?.filter(x => x?.type === "text").map(x => x?.text || "").join("") ||
    stepText ||
    "";

  return {
    ok: true,
    provider: "GOOGLE_GEMINI",
    status: "VERIFIED",
    agent: body.agent,
    http_status: response.status,
    interaction_id: payload?.id || null,
    status_value: payload?.status || null,
    output_text: outputText,
    raw_output_count: Array.isArray(payload?.output) ? payload.output.length : null,
    steps: Array.isArray(payload?.steps)
      ? payload.steps.map(step => ({
          type: step?.type || null,
          name: step?.name || null,
          id: step?.id || null,
          status: step?.status || null
        }))
      : null
  };
}

export async function geminiGenerate(
  env,
  { prompt, maxOutputTokens = 350, temperature = 0.1, mcp = false, previousInteractionId = null, background = false } = {}
) {
  if (mcp === true) {
    return geminiAgent(env, { prompt, previousInteractionId, background });
  }

  if (!env?.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");
  if (!prompt || typeof prompt !== "string") throw new Error("GEMINI_PROMPT_REQUIRED");
  if (String(env.GEMINI_FREE_MODE || "1") !== "1") {
    throw new Error("GEMINI_FREE_MODE_DISABLED");
  }

  const model = modelName(env);
  const url = GEMINI_API_BASE + "/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(env.GEMINI_API_KEY);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: Math.min(Number(maxOutputTokens) || 350, 700),
          temperature: Math.max(0, Math.min(Number(temperature) || 0.1, 0.3))
        }
      })
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        ok: false,
        provider: "GOOGLE_GEMINI",
        status: "FAILED",
        http_status: response.status,
        model,
        error: payload?.error?.message || "GEMINI_REQUEST_FAILED"
      };
    }

    const text = payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("") || "";

    return {
      ok: true,
      provider: "GOOGLE_GEMINI",
      status: "VERIFIED",
      model,
      http_status: response.status,
      text,
      finish_reason: payload?.candidates?.[0]?.finishReason || null,
      usage: payload?.usageMetadata || null
    };
  } catch {
    return {
      ok: false,
      provider: "GOOGLE_GEMINI",
      status: "FAILED",
      model,
      error: "GEMINI_FETCH_FAILED"
    };
  }
}
