// Day-1 check (g): Postgres full-text search on 20 English + 20 Hindi chunks, 5 queries per language.
// English: 'english' config. Hindi: 'simple' (plan §11) vs 'hindi' (Snowball stemmer, found on Neon PG 18).
// Uses a TEMP table over the direct (unpooled) connection, so nothing is left in the database.
// Hindi text: Hindi Wikipedia (CC BY-SA 4.0), cached in artifacts/day1/g-hi-wiki.json.
// Run: node --env-file=.env scripts/day1/fts.mjs
import { readFile, writeFile, access } from 'node:fs/promises'
import pg from 'pg'

const exists = (p) => access(p).then(() => true, () => false)

// --- English chunks: 20 pages of the 14th Arctic Expedition report (one chunk per page)
const REPORT = '14-Arctic_Expedition-2023-24_Report-Low_Resolution'
const EN_PAGES = [3, 13, 14, 18, 20, 21, 22, 23, 28, 30, 31, 36, 40, 42, 44, 48, 51, 52, 55, 66]
const pages = JSON.parse(await readFile(`artifacts/day1/pdf/${REPORT}.pages.json`, 'utf8'))
const en = EN_PAGES.map((p) => ({ locale: 'en', ref: `${REPORT} p${p}`, text: pages[p - 1].text.replace(/\s+/g, ' ').trim() }))

// --- Hindi chunks: paragraphs of Hindi Wikipedia polar articles, ~60-150 words each
const HI_TITLES = ['भारती (अनुसन्धान केंद्र )', 'मैत्री अनुसंधान केन्द्र', 'दक्षिण गंगोत्री', 'राष्ट्रीय अंटार्कटिक एवं समुद्री अनुसंधान केंद्र', 'अंटार्कटिका', 'हिमानी', 'आर्कटिक', 'हिमाद्रि']
const WIKI = 'artifacts/day1/g-hi-wiki.json'
if (!(await exists(WIKI))) {
  const articles = []
  for (const title of HI_TITLES) { // full-text extracts come one page per request
    const u = new URL('https://hi.wikipedia.org/w/api.php')
    for (const [k, v] of Object.entries({ action: 'query', prop: 'extracts|info', inprop: 'url', explaintext: '1', format: 'json', titles: title })) u.searchParams.set(k, v)
    const j = await (await fetch(u, { headers: { 'User-Agent': 'sih26063-day1-check/0.1' } })).json()
    const p = Object.values(j.query.pages)[0]
    articles.push({ title: p.title, url: p.fullurl, license: 'CC BY-SA 4.0', text: p.extract ?? '' })
  }
  await writeFile(WIKI, JSON.stringify(articles, null, 2))
}
const articles = JSON.parse(await readFile(WIKI, 'utf8'))
const hi = []
for (const a of articles) {
  let buf = ''
  const out = []
  for (const para of a.text.split(/\n+/).map((s) => s.trim()).filter((s) => s && !/^=+/.test(s))) {
    buf = buf ? `${buf} ${para}` : para
    if (buf.split(/\s+/).length >= 60) { out.push(buf); buf = '' }
  }
  if (buf.split(/\s+/).length >= 20) out.push(buf)
  hi.push(...out.slice(0, 4).map((text, i) => ({ locale: 'hi', ref: `${a.title} #${i + 1}`, text: text.split(/\s+/).slice(0, 150).join(' ') })))
}
hi.splice(20)

// --- Queries; relevance = what a human would accept (spelling variants, synonyms, inflections)
const QUERIES = [
  { locale: 'en', q: 'aerosols', rel: [/aerosol/i] },
  { locale: 'en', q: 'glacier mass balance', rel: [/glacier/i, /mass balance/i] },
  { locale: 'en', q: 'microplastic pollution', rel: [/micro-?plastic/i, /pollut/i] },
  { locale: 'en', q: 'Himadri station', rel: [/Himadri/i] },
  { locale: 'en', q: 'fjord sampling', rel: [/fjord/i, /sampl/i] },
  { locale: 'hi', q: 'भारती स्टेशन कहाँ है?', rel: [/भारती/] }, // demo question (plan §19)
  { locale: 'hi', q: 'मैत्री केंद्र', rel: [/मैत्री/] }, // text spells केन्द्र and केंद्र
  { locale: 'hi', q: 'अंटार्कटिका अभियानों', rel: [/अंटार्क?टि|अण्टार्कटि/, /अभियान/] }, // plural form
  { locale: 'hi', q: 'हिमनद', rel: [/हिमनद|हिमानी|ग्लेशियर/] }, // synonyms
  { locale: 'hi', q: 'वैज्ञानिकों', rel: [/वैज्ञानिक/] }, // plural form
]

const client = new pg.Client({ connectionString: process.env.DATABASE_URL.replace('-pooler.', '.') })
await client.connect()
// Plan §11 table shape, including the (verify) generated column with a CASE over regconfig,
// plus tsv_hindi to compare the 'hindi' config for Hindi rows.
await client.query(`create temp table archive_chunks (
  id bigserial primary key, collection text not null default 'reports', doc_id text not null default 'day1',
  locale text not null, position int not null default 0, page int, heading text, text text not null,
  tsv tsvector generated always as (to_tsvector(case when locale = 'hi' then 'simple'::regconfig else 'english'::regconfig end, coalesce(heading,'') || ' ' || text)) stored,
  tsv_hindi tsvector generated always as (to_tsvector(case when locale = 'hi' then 'hindi'::regconfig else 'english'::regconfig end, coalesce(heading,'') || ' ' || text)) stored)`)
await client.query('create index on archive_chunks using gin (tsv)')
const chunks = [...en, ...hi]
for (const c of chunks) {
  c.id = +(await client.query('insert into archive_chunks (locale, heading, text) values ($1, $2, $3) returning id', [c.locale, c.ref, c.text])).rows[0].id
}

const HINDI_STOP = new Set(['कहाँ', 'कहां', 'है', 'हैं', 'क्या', 'का', 'की', 'के', 'में', 'से', 'को', 'और', 'कौन', 'कब', 'कैसे'])
const modes = (locale) => locale === 'en'
  ? [['english', 'tsv', 'english', (q) => q]]
  : [
      ['simple (plan)', 'tsv', 'simple', (q) => q],
      ['hindi', 'tsv_hindi', 'hindi', (q) => q],
      ['hindi, stopwords dropped, OR', 'tsv_hindi', 'hindi', (q) => q.replace(/[?।]/g, '').split(/\s+/).filter((w) => !HINDI_STOP.has(w)).join(' or ')],
    ]

const results = []
for (const { locale, q, rel } of QUERIES) {
  const relevant = chunks.filter((c) => c.locale === locale && rel.every((r) => r.test(c.text))).map((c) => c.id)
  for (const [mode, col, cfg, rewrite] of modes(locale)) {
    const query = rewrite(q)
    const { rows } = await client.query(
      `select id, ts_rank(${col}, query) as rank, ts_headline($2::regconfig, text, query, 'MaxWords=18, MinWords=8') as snippet
       from archive_chunks, websearch_to_tsquery($2::regconfig, $1) query
       where locale = $3 and ${col} @@ query order by rank desc`, [query, cfg, locale])
    const hit = rows.filter((r) => relevant.includes(Number(r.id))).length
    results.push({
      locale, q, mode, tsquery: (await client.query('select websearch_to_tsquery($2::regconfig, $1)::text as t', [query, cfg])).rows[0].t,
      relevant: relevant.length, returned: rows.length, relevantReturned: hit,
      recall: relevant.length ? +(hit / relevant.length).toFixed(2) : null,
      top: rows[0] ? { ref: chunks.find((c) => c.id === Number(rows[0].id)).ref, snippet: rows[0].snippet } : null,
    })
  }
}
await client.end()
await writeFile('artifacts/day1/g-chunks.json', JSON.stringify(chunks, null, 2))
await writeFile('artifacts/day1/g-results.json', JSON.stringify(results, null, 2))
console.log(`chunks: ${en.length} en, ${hi.length} hi`)
for (const r of results) console.log(`${r.locale} | ${r.q.padEnd(24)} | ${r.mode.padEnd(30)} | ${r.tsquery.padEnd(40)} | relevant ${r.relevant} returned ${r.returned} recall ${r.recall}`)
