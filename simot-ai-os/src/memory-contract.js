const REF_TYPES = new Set(["FILE","FOLDER","DOCUMENT","IMAGE","VIDEO","AUDIO","DATASET","RECORD","URL"]);
const CONFIDENTIALITY = new Set(["INTERNAL","CONFIDENTIAL","RESTRICTED"]);
const VERIFICATION = new Set(["VERIFIED","INTERNAL","SECONDARY","UNVERIFIED","AI-INFERRED","SUPERSEDED","REJECTED"]);

function list(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [String(value)];
}

export function normalizeMemoryRef(input = {}) {
  const ref = {
    memory_ref: String(input.memory_ref ?? ""),
    ref_type: String(input.ref_type ?? "FILE").toUpperCase(),
    source_system: String(input.source_system ?? ""),
    location: String(input.location ?? ""),
    file_id: input.file_id == null ? null : String(input.file_id),
    name: input.name == null ? null : String(input.name),
    mime_type: input.mime_type == null ? null : String(input.mime_type),
    version: input.version == null ? null : String(input.version),
    checksum: input.checksum == null ? null : String(input.checksum),
    size_bytes: input.size_bytes == null ? null : Number(input.size_bytes),
    confidentiality: String(input.confidentiality ?? "INTERNAL").toUpperCase(),
    verification: String(input.verification ?? "UNVERIFIED").toUpperCase(),
    requirement_ids: list(input.requirement_ids ?? input.requirement_id),
    rfq_ids: list(input.rfq_ids ?? input.rfq_id),
    task_ids: list(input.task_ids ?? input.task_id),
    record_ids: list(input.record_ids ?? input.record_id)
  };
  return ref;
}

export function validateMemoryRef(input = {}) {
  const ref = normalizeMemoryRef(input);
  if (!ref.memory_ref) return { ok: false, error: "MISSING_MEMORY_REF" };
  if (!ref.source_system) return { ok: false, error: "MISSING_MEMORY_SOURCE" };
  if (!ref.location) return { ok: false, error: "MISSING_MEMORY_LOCATION" };
  if (!REF_TYPES.has(ref.ref_type)) return { ok: false, error: "INVALID_MEMORY_REF_TYPE" };
  if (!CONFIDENTIALITY.has(ref.confidentiality)) return { ok: false, error: "INVALID_MEMORY_CONFIDENTIALITY" };
  if (!VERIFICATION.has(ref.verification)) return { ok: false, error: "INVALID_MEMORY_VERIFICATION" };
  if (ref.size_bytes != null && (!Number.isSafeInteger(ref.size_bytes) || ref.size_bytes < 0)) {
    return { ok: false, error: "INVALID_MEMORY_SIZE" };
  }
  return { ok: true, ref };
}

export function buildMinimalMemoryContext(refs = []) {
  return refs.map(input => {
    const validation = validateMemoryRef(input);
    if (!validation.ok) throw new Error(validation.error);
    const { ref } = validation;
    return {
      memory_ref: ref.memory_ref,
      source_system: ref.source_system,
      location: ref.location,
      ref_type: ref.ref_type,
      version: ref.version,
      checksum: ref.checksum,
      confidentiality: ref.confidentiality,
      verification: ref.verification
    };
  });
}

export const MEMORY_CONTRACT = Object.freeze({
  purpose: "reference-first persistent external memory",
  principle: "send references and metadata first; fetch content on demand",
  canonical_file_layer: "Microsoft OneDrive connector until dedicated SharePoint library is exposed",
  canonical_policy_layer: "Notion",
  no_chat_upload_dependency: true
});
