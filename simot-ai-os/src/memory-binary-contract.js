const MIME_RE = /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i;
const RAW_FILE_MODES = new Set(["METADATA_ONLY","RAW_BYTES"]);
const IMAGE_MIME_RE = /^image\//i;

export function validateRawFileReference(ref = {}) {
  const fileId = String(ref.file_id ?? "").trim();
  const fileName = String(ref.file_name ?? "").trim();
  const mimeType = String(ref.mime_type ?? "").trim();
  const downloadUrl = String(ref.download_url ?? "").trim();

  if (!fileId) return { ok: false, error: "RAW_FILE_ID_REQUIRED" };
  if (!fileName) return { ok: false, error: "RAW_FILE_NAME_REQUIRED" };
  if (!mimeType || !MIME_RE.test(mimeType)) return { ok: false, error: "RAW_FILE_MIME_INVALID" };
  if (!downloadUrl) return { ok: false, error: "RAW_FILE_DOWNLOAD_URL_REQUIRED" };

  return {
    ok: true,
    reference: {
      file_id: fileId,
      file_name: fileName,
      mime_type: mimeType,
      download_url: downloadUrl,
      is_image: IMAGE_MIME_RE.test(mimeType)
    }
  };
}

export function buildRawFileRequest(ref, mode = "RAW_BYTES") {
  const check = validateRawFileReference(ref);
  if (!check.ok) return check;

  const normalizedMode = String(mode).toUpperCase();
  if (!RAW_FILE_MODES.has(normalizedMode)) {
    return { ok: false, error: "RAW_FILE_MODE_INVALID" };
  }

  return {
    ok: true,
    mode: normalizedMode,
    reference: check.reference,
    downstream: normalizedMode === "RAW_BYTES"
      ? "BINARY_FILE_HANDLER"
      : "METADATA_HANDLER"
  };
}

export const MEMORY_BINARY_CONTRACT = Object.freeze({
  purpose: "retrieve binary files from persistent memory without ChatGPT upload dependency",
  flow: ["MEMORY_REF","CONNECTOR_FETCH","RAW_FILE_REFERENCE","BINARY_FILE_HANDLER","AI_PROCESSING"],
  image_support: true,
  reference_first: true,
  raw_download: true,
  short_lived_download_urls: true,
  never_persist_connector_download_url: true,
  fail_closed: true
});
