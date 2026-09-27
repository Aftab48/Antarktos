// Day-1 check (e): render the stored packs as Markdown for a Hindi-speaking reviewer (no LLM calls).
// Writes artifacts/day1/e-review/<model>.<variant>.md and artifacts/day1/e-review/hindi-side-by-side.md
// Run: node scripts/day1/review-md.mjs
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'

const IN = 'artifacts/day1/e-packs'
const OUT = 'artifacts/day1/e-review'
await mkdir(OUT, { recursive: true })

const records = []
for (const f of (await readdir(IN)).filter((f) => f.endsWith('.json')).sort()) {
  const r = JSON.parse(await readFile(`${IN}/${f}`, 'utf8'))
  records.push(r)
  const it = r.pack?.items
  if (!it) continue
  const md = [
    `# ${r.model} — ${r.variant}`,
    `${(r.ms / 1000).toFixed(1)} s · $${r.usage?.cost?.toFixed(4)} · checks failed: ${r.checks.filter((c) => !c.pass).map((c) => c.name).join(', ') || 'none'}`,
    `## Blog: ${it.blog?.title}`, it.blog?.body,
    `## X`, it.x?.post, ...(it.x?.thread ?? []).map((t) => `- ${t}`),
    `## Instagram`, it.instagram?.caption, (it.instagram?.hashtags ?? []).join(' '),
    `## LinkedIn`, it.linkedin?.post,
    `## Press note: ${it.press_note?.headline}`, `*${it.press_note?.dateline}*`, it.press_note?.body, `**About:** ${it.press_note?.about}`,
    `## Student explainer: ${it.student_explainer?.title}`, it.student_explainer?.body,
    `### Quiz`, ...(it.student_explainer?.quiz ?? []).map((q, i) => `${i + 1}. ${q.question}\n${q.options.map((o, j) => `   - ${j === q.answer_index ? '**' + o + '**' : o}`).join('\n')}\n   - _${q.explanation}_ [c:${q.chunk_id}]`),
  ].join('\n\n')
  await writeFile(`${OUT}/${f.replace('.json', '.md')}`, md)
}

// Side by side: the same short items from every Hindi variant.
const hindi = records.filter((r) => r.variant.startsWith('hi') && r.pack?.items)
const side = ['# Hindi variants side by side', '',
  ...['x.post', 'student_explainer.first_paragraph', 'quiz[0]'].flatMap((what) => [`## ${what}`, '',
    ...hindi.map((r) => {
      const it = r.pack.items
      const text = what === 'x.post' ? it.x?.post
        : what === 'quiz[0]' ? `${it.student_explainer?.quiz?.[0]?.question} — ${it.student_explainer?.quiz?.[0]?.options?.join(' / ')}`
        : it.student_explainer?.body?.split('\n').find((l) => l.trim() && !l.startsWith('#'))
      return `**${r.model} · ${r.variant}**\n\n> ${text}\n`
    })])]
await writeFile(`${OUT}/hindi-side-by-side.md`, side.join('\n'))
console.log(`wrote ${records.length} reviews + side-by-side to ${OUT}`)
