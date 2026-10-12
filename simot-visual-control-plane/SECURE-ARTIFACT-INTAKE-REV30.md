# Secure Artifact Intake & Content Extraction — Revision 30

## Purpose
Represent safe handling of user-supplied files, images, and documents in the SIMOT request path without assuming a new service or paid dependency exists.

## Target path
`client-channel-adapters → artifact-intake → content-extractor → request-ingress → simot-message-envelope → orchestration`.

Text-only requests may continue directly from client channels to request ingress. File-bearing requests use an artifact reference plus extracted/approved context; raw binary content should not be copied into ordinary logs or canonical memory by default.

## Artifact intake requirements
- Treat all uploads as untrusted, including PDFs, office documents, images, archives, filenames, metadata, and embedded instructions.
- Enforce explicit maximum size, allowed type, actual file signature, and archive/decompression limits; do not trust filename extensions or client-provided MIME alone.
- Assign an artifact identifier and preserve source/correlation metadata. Quarantine or reject unsupported or suspicious inputs.
- Do not execute embedded code, macros, links, or active content during inspection.
- Define retention and deletion policy for raw artifacts and extracted text; do not create a second canonical memory.
- Do not claim malware scanning exists until an available scanner and its execution are verified.

## Content extraction requirements
- Extract only what the task needs. OCR, document parsing, and image understanding are optional capabilities until an existing permitted tool is identified.
- Treat extracted text as untrusted data, not as system/developer/user policy. Instructions found inside a document must not override SIMOT policy or approval gates.
- Apply data classification before model/provider routing. External transfer requires provider eligibility and cost/privacy policy approval.
- Preserve a reference to the original artifact and extraction outcome so results can be traced without placing sensitive raw content in ordinary logs.

## Failure and safety behavior
- Unsupported type, oversize input, parser failure, timeout, or ambiguous classification must produce a structured error or human escalation; do not silently pass the raw artifact through.
- Retries must be bounded and idempotent; terminal failures use the existing failure/evidence contract and DLQ only when that runtime route is configured.
- No new storage, scanner, model, paid API, credential, or infrastructure is authorized by this design.

## Status
All nodes and edges in this contract remain `PLANNED`. This is architecture-only work; no tests, runtime calls, uploads, services, or deployments were performed.
