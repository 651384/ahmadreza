# SIMOT AI OS — Model Routing, Privacy & Cost Policy

**Graph revision:** 18  
**Graph size:** 68 nodes, 147 edges  
**Branch:** `feat/simot-visual-control-plane-react-flow`

## Principles

1. **Free-first / local-first:** prefer existing local or no-additional-cost options when they meet task requirements.
2. **No implicit spend:** no paid API, provider activation, subscription, or new cost-bearing dependency without explicit user approval.
3. **Jarvis constraint:** the existing project constraint rejects the paid OpenAI API for Jarvis/SIMOT unless the user explicitly changes that decision.
4. **Classify before routing:** data classification and transfer rules constrain which providers may receive context.
5. **Provider eligibility is per task:** capability, sensitivity, approved scope, availability, and cost must all be considered.
6. **No silent fallback:** fallback is allowed only to an already approved provider/model; inability to determine eligibility means fail closed.
7. **Bound cost:** use a per-task budget/ceiling where supported; ask for approval before introducing new spend.
8. **Audit decisions safely:** record provider/model selection and rationale without storing secret values or unnecessary sensitive prompt content.

## Model selection decision path

- Determine task requirements and required capability.
- Apply data classification and permitted-transfer rules.
- Exclude unapproved, unavailable, over-budget, or disallowed providers.
- Prefer capable free/local options under the user's existing constraints.
- Require explicit approval for new paid options or additional cost.
- Record the selected provider/model, reason, and outcome as evidence where appropriate.

The presence of a model/provider node in the graph does not prove access, approval, readiness, or active routing. Existing provider status remains unchanged until later evidence-based verification.

## Current phase boundary

Revision 18 records the policy in the architecture graph. No provider settings, credentials, model routes, billing, or runtime configuration were changed. No tests or verification were performed.
