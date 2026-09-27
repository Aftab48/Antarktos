# Agent Prompts — run in order

Give the coding agent one prompt at a time. After each one, check the **Done when** line yourself before moving on.
The agent reads `AGENTS.md`, and that file points it to `plan/SIH26063_plan.md`.

**Setup status:** Payload 3 scaffold ✓ (blank template, Postgres adapter), git repo ✓ (github.com/Aftab48/SIH26063), `PAYLOAD_SECRET` ✓ (dev value in `.env`, rotate before final deploy), OpenRouter ✓ (credits), Neon ☐, Cloudflare R2 ☐, Vercel ☐

Before prompt 1: create the Neon project, the R2 bucket + API token, and a Vercel project; put the values in `.env` (Payload's default, gitignored).

---

## 1. Day-1 checks

```text
Use the Rapid Prototyper agent. Do plan §18 "Day-1 checks" only.
The Payload 3 blank template is already scaffolded and pushed; build on it, don't re-scaffold. Add the missing env var names to .env.example (names only). .env already has real values; don't overwrite it.
Then check, in this order, and record the real results:
(a) a Payload migration runs on Neon; which connection string migrations need;
(b) @payloadcms/storage-s3 on R2 with client-side uploads: upload a 20 MB PDF from the deployed Vercel preview, not only localhost;
(c) the Vercel Hobby function max duration;
(d) PDF text extraction on 3 real NCPOR PDFs from data/pdfs/ (text quality, page mapping, time, which are scanned);
(e) 2–3 OpenRouter text models on one report excerpt producing the §10.1 pack as JSON in English and Hindi, plus a translate-from-English variant for Hindi; save outputs for a Hindi-speaking reviewer; record latency and cost;
(f) the vision model on 5 polar photos from data/photos/ for captions + alt text in both languages;
(g) Postgres full-text search with 'english' and 'simple' configs on 20 English and Hindi chunks, 5 queries each.
Write results to docs/day1-checks.md and artifacts/day1/. Update plan §4 and every (verify) item you resolved.
Recommend LLM_MODEL_TEXT and LLM_MODEL_VISION.
```

**Done when:** Payload admin runs on Neon, a 20 MB PDF uploads to R2 from the Vercel preview, and you have chosen both models after the Hindi review.

---

## 2. Collections, roles, localization, seed

```text
Use the Rapid Prototyper agent. Build plan §16 as Payload collections:
users (roles admin/editor/reviewer), expeditions, stations, reports, datasets, publications, media, events, outreach-posts.
- Localization en + hi on the fields marked * in §16.
- Drafts + versions on every content collection. Public read = published only. Only reviewer/admin can publish (§8.2).
- Uploads go to R2 with client uploads; per-collection file type and size allowlist.
- archive_chunks and ask_log as plain SQL in a Payload custom migration (§11, §16). Check the generated tsvector column works; if not, do what §11 says.
- A seed script (scripts/seed/) that loads data/seed/*.json into expeditions, stations and events, and never duplicates on re-run.
Don't build the pipeline or any AI yet.
```

**Done when:** you log in as editor and reviewer, create a report with a PDF, and only the reviewer can publish it; the seed loads expeditions and stations.

---

## 3. Processing pipeline

```text
Use the Rapid Prototyper agent. Build plan §7:
- afterChange hook that starts processing with after(), and processing_state on each record
- PDF text extraction with page numbers; no text layer -> needs_ocr
- chunking and inserting into archive_chunks (per locale), re-index on publish/unpublish
- metadata-only records indexed as one chunk
- document summary (summary en/hi, keywords) with the text model, and image caption + alt text (en/hi) with the vision model, both validated JSON, both stored, never re-called for an already-processed record
- pipeline:stuck and pipeline:process scripts (§15)
Test with 2 PDFs and 3 photos only.
```

**Done when:** an uploaded PDF reaches `ready` with a summary and searchable chunks, a scanned PDF lands in `needs_ocr`, and a photo gets Hindi alt text.

---

## 4. Checkpoint review

```text
Use the Code Reviewer agent, then the AI-Generated Code Security Auditor agent, on everything built so far.
Focus on: exposed secrets, Payload access control (can the public read drafts? can an editor publish?), upload type/size checks, prompt injection via PDF and image text, and error handling that leaves records stuck in processing.
Fix confirmed issues only. List what you fixed and what you skipped, with reasons.
```

---

## 5. Public portal

```text
Use the Frontend Developer agent. Build the plan §15 public pages: home, expeditions timeline, expedition detail, stations, station detail, archive browse with filters, record detail pages (report, dataset, publication, media, event), about.
- Read with Payload's Local API, published docs only.
- English at /, Hindi at /hi, with a language toggle on every page and correct lang attributes. No hardcoded UI strings.
- Expedition and station pages gather all their linked records.
- Mobile-friendly, keyboard navigable, alt text from the media records.
Leave slots for search, ask, learn and news (next steps); don't build them.
```

**Done when:** you can go from home → an expedition → its report → the original PDF, in both languages.

---

## 6. Search + ask the archive

```text
Use the Prompt Engineer agent to write the ask-the-archive prompt (§12: answer only from chunks, question's language, [c:id] per sentence) and the optional question-to-keywords prompt with its plain fallback.
Then use the Rapid Prototyper agent to build GET /api/search and POST /api/ask as in §11 and §12: websearch_to_tsquery, filters, ts_rank, one result per document with a ts_headline snippet; the ask guard (length cap, per-IP-hash rate limit, 24h cache in ask_log); the zero-hit path with no LLM call; dropping uncited sentences and invalid citations.
Then use the Frontend Developer agent to add search to the archive page and build the /ask page with source cards.
Test with 3 English and 3 Hindi questions, including one the archive can't answer.
```

**Done when:** a Hindi question gets a cited answer, an unanswerable question says "not found in the archive", and the 11th question in an hour is refused.

---

## 7. Outreach generation

```text
Use the Content Creator agent to write a short platform guide for §10.1: tone, structure and one good example per platform (blog, x, instagram, linkedin, press_note, student_explainer) for a government science body, in English and Hindi. Save it to docs/platform-guide.md.
Then use the Prompt Engineer agent to write the generation prompt from §10.1 and §10.2 using that guide, with the strict JSON schema and a validator.
Then use the Rapid Prototyper agent to build POST /api/generate (staff only): one call per language, the §10.3 checks in code (schema, citations, numbers, length, language), saving each item as a draft outreach-post with sources, cited_chunk_ids, checks, model and prompt_version.
Test on 2 records only.
```

**Done when:** one report produces all 6 platforms in both languages, each draft lists its checks, and a planted wrong number is flagged.

---

## 8. Review UI, news, learn

```text
Use the Frontend Developer agent. Build:
- in the Payload admin: a "Generate outreach" button on each record, and on outreach-posts the pass/fail checks, citations rendered as links to the source record and page, and approve/reject with a note (reviewer only)
- the public /news page with approved posts, copy + share-intent buttons and image download (§10.4)
- the public /learn page with student explainers and the in-browser quiz (§13), with citations and a link to /ask
Use Payload admin custom components where a built-in feature doesn't exist.
```

**Done when:** a reviewer approves a Hindi X post and it appears on /news with a working share link, and a quiz runs on /learn.

---

## 9. Second checkpoint

```text
Use the Code Reviewer agent, then the AI-Generated Code Security Auditor agent, on everything built since the last review.
Focus on: uncited or unchecked generated content reaching the public, the public /api/ask (rate limit, cost, prompt injection), access control on publishing, and secrets.
Fix confirmed issues only. List what you fixed and what you skipped, with reasons.
```

---

## 10. Hindi + accessibility pass

```text
Use the Internationalization Engineer agent to find English leftovers on /hi pages, missing lang attributes, date/number formatting for hi-IN, and Devanagari font rendering. Fix them.
Then use the Accessibility Auditor agent to audit the §19 demo path against WCAG 2.1 AA and GIGW basics (keyboard, focus, alt text, contrast, headings, skip link). Fix the confirmed issues.
Don't add features.
```

**Done when:** the whole demo path works with only the keyboard, and /hi has no English UI text.

---

## 11. Stretch (only if time allows)

```text
Use the Rapid Prototyper agent. Build stretch items 1 and 2 from plan §17:
- the station map (Leaflet; polar projection only if simple)
- the Instagram card image with next/og ImageResponse (photo + headline from an approved post)
Stop after each item so I can test it.
```

---

## 12. Visual polish

```text
Use the UI Designer agent. Polish only the demo path in plan §19: a consistent visual language suited to a government science portal, loading and empty states, processing-state indicators, readable citations and check lists.
Don't add features.
```

---

## 13. Pre-demo check

```text
Use the Reality Checker agent. Walk through the plan §19 demo story step by step on the deployed Vercel app with the demo dataset.
For each step: pass or fail, with proof.
List what would embarrass us in front of judges, most severe first.
```

---

## D. Demo dataset (run in a second session, alongside the build)

This only touches `scripts/dataset/` and `data/`, so it won't conflict with the main build.

```text
Use the Rapid Prototyper agent. Build a dataset collection script in scripts/dataset/ (Node, no new heavy dependencies). Output goes to data/, which is gitignored.
1. Photos: fetch openly licensed polar images from the Wikimedia Commons API (licenses: cc0, pd, cc-by, cc-by-sa only), with polite rate limiting.
   Queries, about 20 each: "Maitri station", "Bharati station Antarctica", "Himadri station Svalbard", "Indian Antarctic expedition", "Larsemann Hills", "Schirmacher Oasis", "Antarctic research vessel", "Antarctic ice core", "Ny-Ålesund", "Himalayan glacier research".
   Save to data/photos/<query-slug>/ and write data/photos/manifest.csv with: file, query, source_url, creator, license, attribution, taken_at, has_gps.
2. Seed facts: write data/seed/expeditions.json and data/seed/stations.json from public sources, with a source_url on every record. Don't invent values; leave a field empty if no source has it.
3. PDFs: download the public PDFs I list in data/pdfs/sources.txt (candidates in plan §19) into data/pdfs/, recording source URL, page count and whether each has a text layer. Skip and report any link that fails.
4. Don't call any AI and don't upload anything.
Report counts per query and license, how many photos have a date or GPS, and queries that returned mostly irrelevant images.
```

**Done when:** `data/` holds ~100–150 licensed polar photos with a manifest, seed JSON for expeditions and stations with sources, and the demo PDFs. Skim the photos and delete the irrelevant ones by hand.

---

## If a step goes off course

```text
Revert the last step's changes and redo it, following AGENTS.md and the plan sections it references. Smallest working change only.
```
