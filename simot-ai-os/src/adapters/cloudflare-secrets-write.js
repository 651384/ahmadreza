const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4";
const TARGET_SECRET = "SIMOT_MASTER_MEMORY_TOKEN";

function blocked(error_code, next_action, extra = {}) {
  return { ok:false, status:"BLOCKED", error_code, next_action, ...extra };
}

function normalize(value) {
  return String(value ?? "").trim().toUpperCase();
}

function requireWriteAuthority(authority) {
  const value = normalize(authority);
  if (value !== "SYSTEM_WRITE_ALLOWED") {
    return blocked(
      "CLOUDFLARE_SECRET_WRITE_AUTHORITY_REQUIRED",
      "REQUIRE_SYSTEM_WRITE_ALLOWED"
    );
  }
  return null;
}

function validSecretName(name) {
  return String(name ?? "") === TARGET_SECRET;
}

async function cloudflareRequest(env, path, options = {}) {
  if (!env?.CLOUDFLARE_MANAGEMENT_API_TOKEN || !env?.CLOUDFLARE_ACCOUNT_ID) {
    return blocked(
      "CLOUDFLARE_MANAGEMENT_NOT_CONFIGURED",
      "CONFIGURE_CLOUDFLARE_MANAGEMENT"
    );
  }

  const response = await fetch(CLOUDFLARE_API + path, {
    ...options,
    headers: {
      Authorization: "Bearer " + env.CLOUDFLARE_MANAGEMENT_API_TOKEN,
      accept: "application/json",
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success !== true) {
    return blocked(
      "CLOUDFLARE_API_FAILED",
      "REVIEW_CLOUDFLARE_RESPONSE",
      {
        http_status: response.status,
        errors: Array.isArray(payload?.errors)
          ? payload.errors.slice(0, 3).map(e => ({
              code: e?.code ?? null,
              message: e?.message ?? null
            }))
          : []
      }
    );
  }

  return {
    ok:true,
    status:"COMPLETED",
    payload
  };
}

export async function writeCloudflareMasterMemorySecret(
  env,
  {
    authority,
    approval = false,
    script_name = "simot-ai-os-gateway",
    secret_name = TARGET_SECRET,
    secret_value
  } = {}
) {
  const authorityBlock = requireWriteAuthority(authority);
  if (authorityBlock) return authorityBlock;

  if (approval !== true) {
    return blocked(
      "APPROVAL_GATE_REQUIRED",
      "PROVIDE_EXPLICIT_APPROVAL"
    );
  }

  if (!validSecretName(secret_name)) {
    return blocked(
      "SECRET_TARGET_NOT_ALLOWED",
      "USE_SIMOT_MASTER_MEMORY_TOKEN_ONLY",
      { allowed_secret: TARGET_SECRET }
    );
  }

  if (!secret_value || typeof secret_value !== "string") {
    return blocked(
      "SECRET_VALUE_MISSING",
      "PROVIDE_SECRET_VALUE"
    );
  }

  if (secret_value.length !== 64) {
    return blocked(
      "MASTER_MEMORY_TOKEN_FORMAT_INVALID",
      "RECHECK_MASTER_MEMORY_TOKEN"
    );
  }

  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const script = encodeURIComponent(script_name);

  const path =
    `/accounts/${accountId}/workers/scripts/${script}/secrets`;

  const result = await cloudflareRequest(env, path, {
    method: "PUT",
    body: JSON.stringify({
      name: TARGET_SECRET,
      type: "secret_text",
      text: secret_value
    })
  });

  if (!result.ok) return result;

  return {
    ok:true,
    status:"COMPLETED",
    verification:"CLOUDFLARE_SECRET_WRITE_ACCEPTED",
    operation:"UPDATE_MASTER_MEMORY_TOKEN",
    script_name,
    secret_name:TARGET_SECRET,
    secret_value_returned:false,
    next_action:"VERIFY_MASTER_MEMORY_E2E_READ"
  };
}

export const CLOUDFLARE_SECRET_WRITE_ADAPTER_CONTRACT = Object.freeze({
  version:"1.0.0",
  system:"CLOUDFLARE",
  operation:"UPDATE_MASTER_MEMORY_TOKEN",
  mode:"WRITE",
  authority:"SYSTEM_WRITE_ALLOWED",
  approval_required:true,
  target_secret:TARGET_SECRET,
  secret_values_never_returned:true,
  readback_required:true,
  fail_closed:true
});
