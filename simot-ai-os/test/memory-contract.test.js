import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMemoryRef, validateMemoryRef, buildMinimalMemoryContext } from "../src/memory-contract.js";

test("valid memory reference", () => {
  const result = validateMemoryRef({
    memory_ref: "MEM-001",
    ref_type: "IMAGE",
    source_system: "ONEDRIVE",
    location: "/SIMOT-AI-OS/MEMORY/INPUTS/photo.png",
    confidentiality: "INTERNAL",
    verification: "UNVERIFIED",
    requirement_id: "REQ-1"
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.ref.requirement_ids, ["REQ-1"]);
});

test("rejects incomplete memory reference", () => {
  assert.equal(validateMemoryRef({memory_ref:"MEM-1"}).ok, false);
  assert.equal(validateMemoryRef({memory_ref:"MEM-1",source_system:"ONEDRIVE",location:"x",ref_type:"BAD"}).error, "INVALID_MEMORY_REF_TYPE");
});

test("minimal context strips large content", () => {
  const ref = normalizeMemoryRef({
    memory_ref:"MEM-2",
    source_system:"ONEDRIVE",
    location:"/x/file.pdf",
    name:"large.pdf",
    size_bytes:999999,
    checksum:"abc",
    requirement_id:"REQ-2"
  });
  const [minimal] = buildMinimalMemoryContext([ref]);
  assert.equal(minimal.memory_ref, "MEM-2");
  assert.equal(minimal.location, "/x/file.pdf");
  assert.equal("name" in minimal, false);
  assert.equal("size_bytes" in minimal, false);
});
