import { formatNumber, href, translator, type Locale } from '@/i18n'
import type { AskAnswer } from '@/search/types'

// Only known citation markers become links. React escapes all source and answer text.
export function Answer({ answer, locale }: { answer: AskAnswer; locale: Locale }) {
  const t = translator(locale)
  return <section aria-labelledby="answer-heading" className="mt-8 border-t pt-6">
    <h2 id="answer-heading" className="text-xl font-semibold">{t('ask.answer')}</h2>
    {answer.status === 'answered' ? <>
      <div lang={answer.locale} className="mt-4 space-y-3 leading-relaxed">
        {answer.sentences.map((sentence, index) => <p key={index}>{sentence.split(/(\[c:[^\]]*\])/gu).map((part, partIndex) => {
          if (!part.startsWith('[c:')) return part
          const id = part.slice(3, -1)
          const sourceIndex = answer.sources.findIndex((source) => source.chunkId === id)
          if (sourceIndex === -1) return null
          return <a key={partIndex} href={`#source-${id}`} lang={locale} aria-label={t('ask.citation', { n: formatNumber(locale, sourceIndex + 1) })} className="citation-link">[{formatNumber(locale, sourceIndex + 1)}]</a>
        })}</p>)}
      </div>
      <h3 className="mt-8 text-lg font-semibold">{t('ask.sources')}</h3>
      <ol className="mt-3 grid gap-3">
        {answer.sources.map((source, index) => <li key={source.chunkId} id={`source-${source.chunkId}`} tabIndex={-1} className="scroll-mt-6 rounded-xl border bg-muted/30 p-4 focus:outline-2 focus:outline-primary">
          <p className="mb-1 text-sm text-muted-foreground">{t('ask.source', { n: formatNumber(locale, index + 1) })}{source.page ? ` · ${t('summary.page', { page: formatNumber(locale, source.page) })}` : ''}</p>
          <a href={source.url} lang={source.titleLocale} className="font-semibold underline underline-offset-4">{source.title}</a>
        </li>)}
      </ol>
    </> : <p lang={answer.locale} className="mt-4 leading-relaxed">{answer.answer}</p>}
    {answer.suggestedSearches.length > 0 && <>
      <h3 className="mt-6 font-semibold">{t('ask.suggestions')}</h3>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
        {answer.suggestedSearches.map((q) => <li key={q}><a href={href(locale, `/archive?${new URLSearchParams({ q })}`)} lang={answer.locale} className="underline underline-offset-4">{q}</a></li>)}
      </ul>
    </>}
  </section>
}
