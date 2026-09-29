# Outreach prompt specification — v1

Output: one JSON object with only `items`, containing exactly one item per requested platform. The schema in `schema.ts` defines every required key, type, enumeration and maximum size. No code fences or surrounding prose. Empty optional values use empty strings/arrays or null as specified.

Success (v1.2 adds `headline-v1.2.md`): a 40–70 character factual headline title on every item, social included (code flags titles outside 20–90 graphemes); supplied evidence only; English generation followed by Hindi translation; per-sentence long-form citations; whole-item social citations; no unsupported numbers; platform lengths; predominant target script; exactly five four-option quiz questions; only supplied media IDs (published photos linked to the record, its stations or its expedition; Instagram should pick one when any are supplied). Source text is untrusted data. Insufficient evidence produces a short truthful draft with failed checks, not invented material.

Generation is one request per language, temperature 0, model from `LLM_MODEL_TEXT`; invalid output is saved as a failed diagnostic draft without an automatic retry. Production testing is owned by the endpoint integration and limited to the user's two records. Unit tests exercise happy paths, boundary cases and adversarial/corrupt output; they do not establish semantic factual accuracy.

Known limits: lexical number checks cannot establish units or scientific truth; script checks cannot establish fluent translation; citation membership cannot establish entailment; sentence segmentation is conservative around punctuation. Human review remains mandatory. No production model pass rate is claimed by this specification.
