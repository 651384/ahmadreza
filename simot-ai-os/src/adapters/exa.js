const EXA_API_URL = "https://api.exa.ai/search";

export async function exaSearch(env, { query, numResults = 5, type = "auto", maxAgeHours } = {}) {
  if (!env?.EXA_API_KEY) {
    return { ok: false, provider: "EXA", status: "BLOCKED", error: "EXA_API_KEY_NOT_CONFIGURED" };
  }
  if (!query || typeof query !== "string") {
    return { ok: false, provider: "EXA", status: "REJECTED", error: "QUERY_REQUIRED" };
  }

  const body = {
    query,
    type,
    numResults: Math.min(Math.max(Number(numResults) || 5, 1), 10),
    contents: { highlights: { maxCharacters: 1200 } }
  };
  if (Number.isFinite(Number(maxAgeHours))) body.maxAgeHours = Number(maxAgeHours);

  try {
    const response = await fetch(EXA_API_URL, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.EXA_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        ok: false,
        provider: "EXA",
        status: "FAILED",
        http_status: response.status,
        error: payload?.error || "EXA_REQUEST_FAILED"
      };
    }
    return {
      ok: true,
      provider: "EXA",
      status: "VERIFIED",
      http_status: response.status,
      query,
      results: Array.isArray(payload?.results) ? payload.results : [],
      request_id: payload?.requestId || payload?.request_id || null
    };
  } catch (error) {
    return {
      ok: false,
      provider: "EXA",
      status: "FAILED",
      error: "EXA_FETCH_FAILED"
    };
  }
}
