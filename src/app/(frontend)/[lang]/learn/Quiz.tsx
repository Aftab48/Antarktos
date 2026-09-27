'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CitationText } from '@/components/outreach/CitationText'
import { formatNumber, translator, type Locale } from '@/i18n'
import { validQuiz, type CitationSource } from '@/outreach/presentation'

export function Quiz({ items, sources, l, contentLocale }: { items: unknown; sources: CitationSource[]; l: Locale; contentLocale: Locale }) {
  const t = translator(l)
  const quiz = validQuiz(items)
  const [selected, setSelected] = useState<Record<number, number>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  if (quiz.length !== 5) return <p className="my-8 rounded-xl border p-4">{t('learn.quizUnavailable')}</p>
  return <section className="my-10" aria-labelledby="quiz-heading"><h2 id="quiz-heading" className="text-2xl font-semibold">{t('learn.quiz')}</h2><p className="mt-2 mb-6 text-muted-foreground">{t('learn.quizHint')}</p>
    <div className="space-y-6">{quiz.map((item, index) => <fieldset key={index} className="rounded-xl border p-5">
      <legend className="px-2 font-semibold" lang={contentLocale}>{formatNumber(l, index + 1)}. {item.question.replace(/\s*\[c:\d+\]/g, '')}</legend>
      <div className="my-3 space-y-2">{item.options.map((option, choice) => <label key={choice} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3" lang={contentLocale}><input className="mt-1 shrink-0" type="radio" name={`quiz-${index}`} checked={selected[index] === choice} disabled={revealed[index]} onChange={() => setSelected({ ...selected, [index]: choice })} /><span>{option}</span></label>)}</div>
      <Button type="button" disabled={selected[index] === undefined} aria-disabled={revealed[index] || undefined} onClick={() => { if (!revealed[index]) setRevealed({ ...revealed, [index]: true }) }}>{t('learn.checkAnswer')}</Button>
      <div role="status" aria-atomic="true">{revealed[index] && <div className="mt-4 rounded-lg bg-muted p-4"><p className="mb-2 font-semibold">{t(selected[index] === item.answer_index ? 'learn.correct' : 'learn.tryAgain')}</p><p className="mb-3"><span>{t('learn.correctAnswer')} </span><span lang={contentLocale}>{item.options[item.answer_index]}</span></p><CitationText text={`${item.explanation} [c:${item.chunk_id}]`} sources={sources} locale={contentLocale} uiLocale={l} publicStyle /></div>}</div>
    </fieldset>)}</div>
    <Button type="button" variant="outline" className="mt-5" onClick={() => { setSelected({}); setRevealed({}) }}>{t('learn.resetQuiz')}</Button>
  </section>
}
