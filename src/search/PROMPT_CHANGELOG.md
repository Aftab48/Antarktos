# Search prompt changelog

## ask-v1.1 — 2026-09-28

- A bounded live response used `[c:8, c:524]`; explicitly require separate markers such as `[c:8][c:524]`. The malformed sentence is discarded.
- Keep valid sentences remaining after filtering even if only one survives; the generation request still asks for two to five. The version bump invalidates earlier answer caches.
- Actual runtime settings: environment-selected text model, temperature 0.1, max_tokens 1600, no automatic retry.

## v1 — 2026-09-28

- Added `ask-v1.md`: source-only English/Hindi answers, two to five individually cited sentences, and empty-array abstention.
- Added explicit untrusted-data boundaries, exact numeric support and valid input-ID constraints.
- Added `keywords-v1.md`: optional extractive terms; malformed or invented terms use the plain English/Hindi OR fallback.
- Ten offline contract cases cover retrieval terms, languages, empty inputs and adversarial boundaries. These checks do not measure model grounding accuracy.
- Initial proposed settings: `LLM_MODEL_TEXT` from environment, temperature 0, max_tokens 1200 (ask) / 256 (optional keywords). Live validation is recorded separately by the step 6 integration check; the prompt-writing task made no paid calls.
