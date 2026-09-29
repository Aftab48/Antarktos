# Outreach prompts — changelog

## outreach-v1.2 — 2026-09-30
- Added tracked `headline-v1.2.md` to both prompts. Every item, including X, Instagram and LinkedIn, now has a 40–70 character factual headline (cited facts only, no hype); it replaces the v1 rule that left social titles empty, which made public H1s and news cards read just "X" and blocked the Instagram card. The Hindi translation translates it.
- Code check: the `length` check also fails when the title is outside 20–90 characters, counted as grapheme clusters with markers excluded (code points would flag faithful Hindi: a 68-character English headline becomes ~97 Devanagari code points but ~72 graphemes), with the issue "Title must be a 20–90 character headline." Title numbers are checked against the item's cited chunks as before.
- Suggested photo: the media list now holds published JPEG/PNG/WebP photos linked to the record itself (photo record, event media, cover) or to its stations or expedition, own photos first, at most 8 (`linkedPhotos` in `store.ts`). The prompt asks for one on each Instagram item when the list is not empty; the validator still drops any ID not in the list. Previously only a record's own `media[]` was offered, so reports never got a photo.
- Existing v1.1 posts are not rewritten; public pages name an untitled post "<Platform> post · <source record>".

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
