# Outreach prompts — changelog

## outreach-v1.1 — 2026-09-28
- Added a tracked citation-syntax clarification to both preserved v1 base prompts: each marker contains one ID; multiple IDs require separate markers. Existing v1 generation records retain their original version.
- Fixed validator diagnostics: malformed citation IDs are stripped before number extraction, so `[c:140, c:141]` is a citation failure rather than a claim of the numbers 140 and 141. Real numbers elsewhere in that uncited sentence still fail the number check.
- Added regression coverage. No extra provider calls or claims of measured model improvement; the initial report-7 live output exposed this failure mode.

## outreach-v1 — 2026-09-28
- Initial English pack generation and checked-English-to-Hindi translation prompts.
- Tracked platform guide distilled from docs/platform-guide.md; no runtime dependency on ignored documentation or example fixture IDs.
- Strict bounded JSON schema and deterministic schema, citation, number, length, script and translation checks.
- One call per language, no retry; save raw output and diagnostic failed drafts on malformed output.
- Temperature 0; production model and actual run evidence recorded by the endpoint integration. No empirical improvement percentage claimed.
