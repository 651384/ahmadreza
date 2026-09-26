const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function modelName(env) {
  return String(env?.GEMINI_MODEL || "gemini-2.5-flash");
}

export async function geminiGenerate(
  env,
  { prompt, maxOutputTokens = 350, temperature = 0.1 } = {}
) {
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
