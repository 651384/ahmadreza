const PATH = "/api/control-plane/graph-sync/run";
const MAX_BODY_BYTES = 4096;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("BODY_TOO_LARGE"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/**
 * Add this plugin to the EXISTING Vite config without replacing the current
 * VPS Master Memory proxy. It keeps SIMOT_MAILBOX_TOKEN server-side.
 */
export function simotGraphSyncProxy() {
  async function middleware(req, res, next) {
    const url = new URL(req.url || "/", "http://localhost");
    if (url.pathname !== PATH) return next();
    if (req.method !== "POST") return send(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });

    const workerUrl = process.env.SIMOT_WORKER_URL;
    const token = process.env.SIMOT_MAILBOX_TOKEN;
    if (!workerUrl || !token) {
      return send(res, 503, { ok: false, error: "GRAPH_SYNC_PROXY_NOT_CONFIGURED" });
    }

    let target;
    try {
      target = new URL("/control-plane/graph-sync/run", workerUrl);
      if (target.protocol !== "https:" || !target.hostname.endsWith(".workers.dev")) {
        return send(res, 503, { ok: false, error: "GRAPH_SYNC_WORKER_URL_NOT_ALLOWED" });
      }
    } catch {
      return send(res, 503, { ok: false, error: "GRAPH_SYNC_WORKER_URL_INVALID" });
    }

    try {
      const body = await readBody(req);
      if (body) JSON.parse(body);
      const upstream = await fetch(target, {
        method: "POST",
        headers: {
          "authorization": "Bearer " + token,
          "content-type": "application/json"
        },
        body: body || "{}"
      });
      const responseText = await upstream.text();
      res.statusCode = upstream.status;
      res.setHeader("content-type", upstream.headers.get("content-type") || "application/json; charset=utf-8");
      res.setHeader("cache-control", "no-store");
      res.end(responseText);
    } catch (error) {
      if (error?.message === "BODY_TOO_LARGE") return send(res, 413, { ok: false, error: "REQUEST_TOO_LARGE" });
      if (!res.headersSent) send(res, 502, { ok: false, error: "GRAPH_SYNC_UPSTREAM_FAILED" });
    }
  }

  return {
    name: "simot-graph-sync-proxy",
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); }
  };
}
