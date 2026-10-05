import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "simot-bridge",
  name: "SIMOT Bridge",
  description: "Routes user turns directly to SIMOT before any local model call.",
  register(api) {
    const config = (api.pluginConfig ?? {}) as {
      endpoint?: string;
      tokenEnv?: string;
    };

    const endpoint =
      config.endpoint ||
      "https://simot-ai-os-gateway.vahid-ahmadreza.workers.dev/jarvis/execute";
    const tokenEnv = config.tokenEnv || "SIMOT_MAILBOX_TOKEN";

    api.on(
      "before_agent_reply",
      async (event) => {
        const message = String(event.cleanedBody ?? "").trim();

        if (!message || message.startsWith("/")) return;

        const token = process.env[tokenEnv];
        if (!token) {
          api.logger.error("SIMOT bridge token is not available to the Gateway process.");
          return {
            handled: true,
            reply: { text: "SIMOT bridge is not configured: authentication token is unavailable." },
          };
        }

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ message }),
            signal: AbortSignal.timeout(120000),
          });

          const data = await response.json().catch(() => null);

          if (!response.ok || !data?.ok) {
            const error = String(data?.error || `HTTP_${response.status}`);
            api.logger.error(`SIMOT request failed: ${error}`);
            return {
              handled: true,
              reply: { text: `SIMOT blocked the request: ${error}` },
            };
          }

          const result = data.result ?? {};
          const status = String(data.status ?? result.result_status ?? "UNKNOWN");
          const answer = String(result.user_answer ?? "").trim();
          const gaps = Array.isArray(result.gaps)
            ? result.gaps.map((x: unknown) => String(x)).filter(Boolean)
            : [];

          if (answer) {
            return { handled: true, reply: { text: answer } };
          }

          if (gaps.length) {
            return {
              handled: true,
              reply: { text: `SIMOT status ${status}: ${gaps.join(" | ")}` },
            };
          }

          return {
            handled: true,
            reply: { text: `SIMOT returned status: ${status}` },
          };
        } catch (error) {
          const messageText =
            error instanceof Error ? error.message : String(error);
          api.logger.error(`SIMOT bridge exception: ${messageText}`);
          return {
            handled: true,
            reply: { text: `SIMOT connection failed: ${messageText}` },
          };
        }
      },
      {
        eligibleTriggers: ["user"],
        timeoutMs: 120000,
      },
    );
  },
});
