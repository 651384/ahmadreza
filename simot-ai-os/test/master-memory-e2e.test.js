import test from "node:test";
import assert from "node:assert/strict";
import { runMasterMemoryE2E } from "../src/adapters/master-memory-write.js";

function makeEnv({ readContentOverride = null, initialContent = null } = {}) {
  const objects = new Map();
  if (initialContent !== null) objects.set("working/E2E-TEST-001", initialContent);
  const calls = [];
  return {
    calls,
    objects,
    SIMOT_MASTER_MEMORY_TOKEN: "test-token",
    SIMOT_MASTER_MEMORY: {
      async fetch(url, init = {}) {
        const method = init.method || "GET";
        calls.push({ url, method });
        if (method === "POST") {
          const body = JSON.parse(init.body);
          objects.set(`${body.bucket}/${body.object_id}`, body.content);
          return new Response(JSON.stringify({ ok: true, metadata: { object_id: body.object_id, version: 1 } }), { status: 201 });
        }
        const match = url.match(/\/memory\/([^/]+)\/([^/]+)$/);
        const key = `${decodeURIComponent(match[1])}/${decodeURIComponent(match[2])}`;
        if (!objects.has(key)) return new Response(JSON.stringify({ ok: false }), { status: 404 });
        const content = readContentOverride === null ? objects.get(key) : readContentOverride;
        return new Response(JSON.stringify({ ok: true, content, metadata: { object_id: match[2], version: 1 } }), { status: 200 });
      }
    }
  };
}

const request = {
  authority: "SYSTEM_WRITE_ALLOWED",
  approval: true,
  bucket: "working",
  object_id: "E2E-TEST-001",
  content: "SIMOT MASTER MEMORY E2E TEST"
};

test("requires explicit write authority and approval", async () => {
  const env = makeEnv();
  const denied = await runMasterMemoryE2E(env, { ...request, approval: false });
  assert.equal(denied.ok, false);
  assert.equal(denied.error_code, "APPROVAL_GATE_REQUIRED");
  assert.equal(env.calls.length, 0);
});

test("writes only to working E2E object and verifies readback without returning content", async () => {
  const env = makeEnv();
  const result = await runMasterMemoryE2E(env, request);
  assert.equal(result.ok, true);
  assert.equal(result.verification, "WRITE_READBACK_MATCH");
  assert.equal(result.readback.content_matches, true);
  assert.equal(result.content_returned, false);
  assert.equal(env.objects.get("working/E2E-TEST-001"), request.content);
  assert.equal(env.calls.filter(x => x.method === "POST").length, 1);
  assert.equal(env.calls.filter(x => x.method === "GET").length, 1);
});

test("fails closed when readback content differs", async () => {
  const env = makeEnv({ readContentOverride: "different content" });
  const result = await runMasterMemoryE2E(env, request);
  assert.equal(result.ok, false);
  assert.equal(result.verification, "WRITE_READBACK_MISMATCH");
  assert.equal(result.readback.content_matches, false);
  assert.equal(result.content_returned, false);
});
