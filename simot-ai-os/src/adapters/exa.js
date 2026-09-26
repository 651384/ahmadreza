const EXA_API_URL = "https://api.exa.ai/search";

export async function exaSearch(env, { query, numResults = 5, type = "auto", maxAgeHours } = {}) {
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
  if (Number.isFinite(maxAgeHours)) body.contents.maxAgeHours = maxAgeHours;

  const response = await fetch(EXA_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.EXA_API_KEY}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`EXA_HTTP_${response.status}`);
  }

  return {
    provider: "EXA",
    capability: "WEB_SEARCH",
    status: "COMPLETED",
    request_id: payload?.requestId || null,
    results: Array.isArray(payload?.results) ? payload.results : [],
    usage: payload?.costDollars || null
  };
}
