'use client'

import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
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
    <form onSubmit={submit} className="mt-6 rounded-xl border p-5" aria-busy={pending}>
      <label htmlFor="archive-question" className="block font-medium">{t('ask.question')}</label>
      <p id="question-hint" className="mt-1 text-sm text-muted-foreground">{t('ask.hint')}</p>
      <textarea id="archive-question" name="question" value={question} onChange={(event) => setQuestion(event.target.value)} required maxLength={300} rows={4} disabled={pending} aria-describedby={`question-hint question-length${error ? ' ask-error' : ''}`} aria-invalid={error === t('ask.invalid') ? true : undefined} className="mt-3 block w-full resize-y rounded-md border bg-background px-3 py-2 leading-relaxed disabled:opacity-70" />
      <p id="question-length" className="mt-2 text-sm text-muted-foreground">{t('ask.remaining', { count: formatNumber(locale, Math.max(0, 300 - length)) })}</p>
      <Button type="submit" disabled={pending || !question.trim() || length > 300} className="mt-4">{t(pending ? 'ask.loading' : 'ask.submit')}</Button>
      {error && <p id="ask-error" role="alert" className="mt-4 font-medium">{error}</p>}
    </form>
    <p role="status" className="mt-3 text-sm text-muted-foreground">{pending ? t('ask.loading') : answer ? t('ask.ready') : ''}</p>
    {answer && <Answer answer={answer} locale={locale} />}
  </>
}
