import type { ReactNode } from 'react'
import { citationParts, type CitationSource } from '../../outreach/presentation'
import { formatNumber, translator, type Locale } from '../../i18n'

export function CitationText({ text, sources, locale, uiLocale = locale, publicStyle = false }: { text: string; sources: CitationSource[]; locale: Locale; uiLocale?: Locale; publicStyle?: boolean }) {
  const t = translator(uiLocale)
  const inline = (value: string): ReactNode => citationParts(value).map((part, index) => {
    if ('text' in part) return part.text
    const source = sources.find((s) => s.id === part.id)
    if (!source) return null
    const n = sources.indexOf(source) + 1
    return <sup key={index}><a className="citation-link" href={source.pageUrl ?? source.recordUrl} lang={uiLocale} aria-label={source.page ? t('summary.citeLabel', { n, page: source.page }) : t('outreach.citation', { n })}>[{formatNumber(uiLocale, n)}]</a></sup>
  })
  return <div lang={locale} className={publicStyle ? 'space-y-4 leading-relaxed break-words' : undefined}>
    {text.split(/\n\s*\n/).map((paragraph, i) => {
      const heading = /^#{1,3}\s+(.+)$/.exec(paragraph.trim())
      return heading ? <h3 key={i} className={publicStyle ? 'text-xl font-semibold' : undefined}>{inline(heading[1])}</h3> : <p key={i} style={{ whiteSpace: 'pre-line' }}>{inline(paragraph)}</p>
    })}
  </div>
}
