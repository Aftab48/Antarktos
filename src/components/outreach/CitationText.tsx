import type { ReactNode } from 'react'
import { citationParts, type CitationSource } from '../../outreach/presentation'
import { formatNumber, translator, type Locale } from '../../i18n'

// A "## Heading" line is a heading whether a blank line or a single newline follows it (generated bodies use both);
// the lines between headings and blank lines form paragraphs.
function blocks(text: string) {
  const out: { heading?: string; text?: string }[] = []
  for (const paragraph of text.split(/\n\s*\n/)) {
    let lines: string[] = []
    const flush = () => { if (lines.join('').trim()) out.push({ text: lines.join('\n').trim() }); lines = [] }
    for (const line of paragraph.split('\n')) {
      const heading = /^#{1,3}\s+(.+)$/.exec(line.trim())
      if (heading) { flush(); out.push({ heading: heading[1] }) } else lines.push(line)
    }
    flush()
  }
  return out
}

// Quiz text cites its chunk_id; the model often writes that marker itself, so add it only when missing.
export const withCitation = (text: string | null | undefined, chunkId: unknown) => text?.includes(`[c:${chunkId}]`) ? text : `${text ?? ''} [c:${chunkId}]`

export function CitationText({ text, sources, locale, uiLocale = locale, publicStyle = false }: { text: string; sources: CitationSource[]; locale: Locale; uiLocale?: Locale; publicStyle?: boolean }) {
  const t = translator(uiLocale)
  const inline = (value: string): ReactNode => citationParts(value).map((part, index) => {
    if ('text' in part) return part.text
    const source = sources.find((s) => s.id === part.id)
    if (!source) return null
    const n = sources.indexOf(source) + 1
    // A cited source opens in a new tab, so the reader (or a quiz in progress) keeps their place.
    return <sup key={index}><a className="citation-link" href={source.pageUrl ?? source.recordUrl} target="_blank" rel="noopener noreferrer" lang={uiLocale} aria-label={`${source.page ? t('summary.citeLabel', { n, page: source.page }) : t('outreach.citation', { n })} (${t('link.newTab')})`}>{publicStyle ? formatNumber(uiLocale, n) : `[${formatNumber(uiLocale, n)}]`}</a></sup>
  })
  return <div lang={locale} className={publicStyle ? 'space-y-4 leading-relaxed break-words' : undefined}>
    {blocks(text).map((block, i) => block.heading !== undefined
      ? <h3 key={i} className={publicStyle ? 'text-[1.3125rem] font-semibold leading-snug' : undefined}>{inline(block.heading)}</h3>
      : <p key={i} style={{ whiteSpace: 'pre-line' }}>{inline(block.text!)}</p>)}
  </div>
}
