'use client'

import { useDocumentInfo, useFormModified } from '@payloadcms/ui'
import { useEffect, useState } from 'react'
import type { CitationSource } from '../../outreach/presentation'
import { CitationText } from './CitationText'

const names: Record<string, string> = { schema: 'JSON schema', citations: 'Valid source citations', numbers: 'Numbers match cited sources', length: 'Platform length', language: 'Language', translation: 'Translation preserves the English pack' }

export function ReviewPreview() {
  const { id, data, lastUpdateTime } = useDocumentInfo()
  const modified = useFormModified()
  const [sources, setSources] = useState<CitationSource[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    setLoading(true)
    fetch(`/api/outreach-preview?id=${encodeURIComponent(id)}`, { signal: controller.signal }).then(async (res) => {
      if (!res.ok) throw new Error('Source preview is unavailable.')
      const value = await res.json()
      setSources(value.sources)
      setError('')
    }).catch((e) => { if (!controller.signal.aborted) setError(e.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [id, lastUpdateTime])
  if (!data) return null
  const language = data.language === 'hi' ? 'hi' : 'en'
  return <section aria-label="Outreach review" className="science-panel science-review">
    <h2>Review checks and sources</h2>
    <p>Use Review status and Review note in the sidebar to approve or reject, then save. Only reviewers and administrators can review. Publish an approved draft to make it public.</p>
    {modified && <p role="status" className="science-review-notice">This preview shows the saved draft. Save your edits to refresh the preview. Edited content needs another review.</p>}
    <ul className="science-checks">{Object.entries(names).map(([key, label]) => <li key={key}><span>{label}</span><strong className={`science-status science-status--${data.checks?.[key] === true ? 'ready' : 'attention'}`}>{data.checks?.[key] === true ? 'PASS' : 'FAIL'}</strong></li>)}</ul>
    {Array.isArray(data.check_issues) && data.check_issues.length > 0 && <><h3>Issues to review</h3><ul>{data.check_issues.map((v: string, i: number) => <li key={i}>{v}</li>)}</ul></>}
    {error && <p role="alert">{error}</p>}
    <div className="science-review-draft"><h3>Saved draft preview</h3>
    {[data.title, data.dateline, ...(data.thread?.length ? data.thread.map((p: { text: string }) => p.text) : [data.body]), data.about].filter(Boolean).map((value, i) => <CitationText key={i} text={value} sources={sources} locale={language} />)}
    {Array.isArray(data.quiz) && data.quiz.length > 0 && <><h3>Quiz</h3><ol>{data.quiz.map((q: any, i: number) => <li key={i}><CitationText text={`${q.question} [c:${q.chunk_id}]`} sources={sources} locale={language} /><ol>{q.options?.map((o: string, j: number) => <li key={j}>{o}{j === q.answer_index ? ' (correct answer)' : ''}</li>)}</ol><CitationText text={`${q.explanation ?? ''} [c:${q.chunk_id}]`} sources={sources} locale={language} /></li>)}</ol></>}
    </div><h3>Sources</h3>
    {loading ? <p role="status">Loading saved source citations…</p> : sources.length ? <ol className="science-sources">{sources.map((s) => <li key={s.id}><a href={s.recordUrl} lang={s.titleLocale} target="_blank" rel="noopener noreferrer">{s.title}</a>{s.pageUrl && <> · <a href={s.pageUrl} target="_blank" rel="noopener noreferrer">Page {s.page}</a></>} <small>[c:{s.id}]</small></li>)}</ol> : <p className="science-review-notice">No readable source citations are available.</p>}
  </section>
}
