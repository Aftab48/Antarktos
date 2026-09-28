'use client'

import { useRef, useState, type FormEvent } from 'react'
import { btn } from '../../_lib/classes'
import { formatNumber, translator, type Locale } from '@/i18n'
import type { AskAnswer } from '@/search/types'
import { Answer } from './Answer'

export function AskForm({ locale }: { locale: Locale }) {
  const t = translator(locale)
  const [question, setQuestion] = useState('')
  const [pending, setPending] = useState(false)
  const submitting = useRef(false)
  const [error, setError] = useState('')
  const [answer, setAnswer] = useState<AskAnswer | null>(null)
  const length = [...question].length

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    if (!question.trim() || length > 300) { setError(t('ask.invalid')); return }
    submitting.current = true
    setPending(true)
    setError('')
    setAnswer(null)
    try {
      const response = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, locale }) })
      if (!response.ok) {
        setError(t(response.status === 429 ? 'ask.rateLimited' : response.status === 400 ? 'ask.invalid' : 'ask.unavailable'))
        return
      }
      setAnswer(await response.json() as AskAnswer)
    } catch { setError(t('ask.unavailable')) }
    finally { submitting.current = false; setPending(false) }
  }

  return <>
    <form onSubmit={submit} className="rounded-xl bg-ice p-6 sm:p-8" aria-busy={pending}>
      <label htmlFor="archive-question" className="block text-lg font-semibold">{t('ask.question')}</label>
      <p id="question-hint" className="mt-1 text-sm text-slate">{t('ask.hint')}</p>
      <textarea id="archive-question" name="question" value={question} onChange={(event) => setQuestion(event.target.value)} required maxLength={300} rows={4} disabled={pending} aria-describedby={`question-hint question-length${error ? ' ask-error' : ''}`} aria-invalid={error === t('ask.invalid') ? true : undefined} className="mt-4 block min-h-32 w-full resize-y rounded-md border border-control bg-snow px-4 py-3 text-lg leading-relaxed disabled:opacity-70" />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p id="question-length" className="font-figures text-sm text-slate">{t('ask.remaining', { count: formatNumber(locale, Math.max(0, 300 - length)) })}</p>
        <button type="submit" disabled={pending || !question.trim() || length > 300} className={btn}>{t(pending ? 'ask.loading' : 'ask.submit')}</button>
      </div>
      {error && <p id="ask-error" role="alert" className="mt-4 font-medium text-alert">{error}</p>}
    </form>
    <p role="status" className="mt-3 text-sm text-slate">{pending ? t('ask.loading') : answer ? t('ask.ready') : ''}</p>
    {answer && <Answer answer={answer} locale={locale} />}
  </>
}
