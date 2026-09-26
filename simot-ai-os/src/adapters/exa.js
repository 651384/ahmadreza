const EXA_API_URL = "https://api.exa.ai/search";

export async function exaSearch(
  env,
  { query, numResults = 5, type = "auto", maxAgeHours } = {}
) {
  if (!env?.EXA_API_KEY) {
    throw new Error("EXA_API_KEY_NOT_CONFIGURED");
  }

  if (!query || typeof query !== "string") {
    throw new Error("EXA_QUERY_REQUIRED");
  }

  const body = {
    query,
    type,
    numResults,
    contents: { highlights: true }
  };

  if (Number.isFinite(maxAgeHours)) {
    body.contents.maxAgeHours = maxAgeHours;
  }

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
      capability: "WEB_SEARCH",
      status: "VERIFIED",
      http_status: response.status,
      query,
      results: Array.isArray(payload?.results) ? payload.results : [],
      request_id: payload?.requestId || payload?.request_id || null,
      usage: payload?.costDollars || null
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