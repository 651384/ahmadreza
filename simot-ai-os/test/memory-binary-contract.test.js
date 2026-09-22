import test from "node:test";
import assert from "node:assert/strict";
import {
  validateRawFileReference,
  buildRawFileRequest,
  MEMORY_BINARY_CONTRACT
} from "../src/memory-binary-contract.js";

const ref = {
  file_id: "file_test_001",
  file_name: "test.png",
  mime_type: "image/png",
  download_url: "https://example.invalid/raw/test"
};

test("valid image raw reference is accepted", () => {
  const r = validateRawFileReference(ref);
  assert.equal(r.ok, true);
  assert.equal(r.reference.is_image, true);
});

test("invalid raw reference fails closed", () => {
  const r = validateRawFileReference({ file_id: "x", mime_type: "image/png" });
  assert.equal(r.ok, false);
  assert.equal(r.error, "RAW_FILE_NAME_REQUIRED");
});

test("raw request selects binary handler", () => {
  const r = buildRawFileRequest(ref, "RAW_BYTES");
  assert.equal(r.ok, true);
  assert.equal(r.downstream, "BINARY_FILE_HANDLER");
});

test("metadata mode does not request binary processing", () => {
  const r = buildRawFileRequest(ref, "METADATA_ONLY");
  assert.equal(r.ok, true);
  assert.equal(r.downstream, "METADATA_HANDLER");
});

test("contract protects short-lived connector URLs", () => {
  assert.equal(MEMORY_BINARY_CONTRACT.raw_download, true);
  assert.equal(MEMORY_BINARY_CONTRACT.never_persist_connector_download_url, true);
});
