import { formatNumber, href, translator, type Locale } from '@/i18n'
import type { AskAnswer } from '@/search/types'
import { sourceItem, sourceList, sourceNum } from '../../_lib/classes'

// Only known citation markers become links. React escapes all source and answer text.
export function Answer({ answer, locale }: { answer: AskAnswer; locale: Locale }) {
  const t = translator(locale)
  return <section aria-labelledby="answer-heading" className="mt-12">
    <h2 id="answer-heading" className="font-display text-2xl">{t('ask.answer')}</h2>
    {answer.status === 'answered' ? <>
      <div lang={answer.locale} className="mt-4 max-w-[65ch] space-y-4 text-lg leading-relaxed">
        {answer.sentences.map((sentence, index) => <p key={index}>{sentence.split(/(\[c:[^\]]*\])/gu).map((part, partIndex) => {
          if (!part.startsWith('[c:')) return part
          const id = part.slice(3, -1)
          const sourceIndex = answer.sources.findIndex((source) => source.chunkId === id)
          if (sourceIndex === -1) return null
          return <a key={partIndex} href={`#source-${id}`} lang={locale} aria-label={t('ask.citation', { n: formatNumber(locale, sourceIndex + 1) })} className="citation-link">{formatNumber(locale, sourceIndex + 1)}</a>
        })}</p>)}
      </div>
      <h3 className="mt-10 text-[1.3125rem] font-semibold leading-snug">{t('ask.sources')}</h3>
      <ol className={sourceList}>
        {answer.sources.map((source, index) => <li key={source.chunkId} id={`source-${source.chunkId}`} tabIndex={-1} className={`${sourceItem} focus:bg-ice focus:outline-3 focus:outline-signal target:bg-ice target:outline-3 target:outline-signal`}>
          <span aria-hidden="true" className={sourceNum}>{formatNumber(locale, index + 1)}</span>
          <div className="min-w-0">
            <a href={source.url} lang={source.titleLocale} className="font-semibold underline"><span className="sr-only">{t('ask.source', { n: formatNumber(locale, index + 1) })}: </span>{source.title}</a>
            {source.page ? <p className="text-sm text-slate">{t('summary.page', { page: formatNumber(locale, source.page) })}</p> : null}
          </div>
        </li>)}
      </ol>
    </> : <p lang={answer.locale} className="mt-4 max-w-[65ch] text-lg leading-relaxed">{answer.answer}</p>}
    {answer.suggestedSearches.length > 0 && <>
      <h3 className="mt-8 font-semibold">{t('ask.suggestions')}</h3>
      <ul className="mt-2 flex flex-wrap gap-x-6">
        {answer.suggestedSearches.map((q) => <li key={q}><a href={href(locale, `/archive?${new URLSearchParams({ q })}`)} lang={answer.locale} className="inline-flex min-h-11 items-center underline">{q}</a></li>)}
      </ul>
    </>}
  </section>
}
