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
  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    fetch(`/api/outreach-preview?id=${encodeURIComponent(id)}`, { signal: controller.signal }).then(async (res) => {
      if (!res.ok) throw new Error('Source preview is unavailable.')
      const value = await res.json()
      setSources(value.sources)
      setError('')
    }).catch((e) => { if (!controller.signal.aborted) setError(e.message) })
    return () => controller.abort()
  }, [id, lastUpdateTime])
  if (!data) return null
  const language = data.language === 'hi' ? 'hi' : 'en'
  return <section aria-label="Outreach review" style={{ border: '1px solid var(--theme-elevation-200)', borderRadius: 'var(--style-radius-m)', padding: 'var(--base)', marginBottom: 'var(--base)', background: 'var(--theme-elevation-50)' }}>
    <h2>Review checks and sources</h2>
    <p>Use Review status and Review note in the sidebar to approve or reject, then save. Only reviewers and administrators can review. Publish an approved draft to make it public.</p>
    {modified && <p role="status">This preview shows the saved draft. Save your edits to refresh the preview. Edited content needs another review.</p>}
    <ul style={{ listStyle: 'none', padding: 0 }}>{Object.entries(names).map(([key, label]) => <li key={key} style={{ margin: '0.5rem 0' }}><strong>{data.checks?.[key] === true ? 'PASS' : 'FAIL'}</strong> — {label}</li>)}</ul>
    {Array.isArray(data.check_issues) && data.check_issues.length > 0 && <><h3>Issues to review</h3><ul>{data.check_issues.map((v: string, i: number) => <li key={i}>{v}</li>)}</ul></>}
    {error && <p role="alert">{error}</p>}
    <h3>Saved draft preview</h3>
    {[data.title, data.dateline, ...(data.thread?.length ? data.thread.map((p: { text: string }) => p.text) : [data.body]), data.about].filter(Boolean).map((value, i) => <CitationText key={i} text={value} sources={sources} locale={language} />)}
    {Array.isArray(data.quiz) && data.quiz.length > 0 && <><h3>Quiz</h3><ol>{data.quiz.map((q: any, i: number) => <li key={i}><CitationText text={`${q.question} [c:${q.chunk_id}]`} sources={sources} locale={language} /><ol>{q.options?.map((o: string, j: number) => <li key={j}>{o}{j === q.answer_index ? ' (correct answer)' : ''}</li>)}</ol><CitationText text={`${q.explanation ?? ''} [c:${q.chunk_id}]`} sources={sources} locale={language} /></li>)}</ol></>}
    <h3>Sources</h3>
    {sources.length ? <ol>{sources.map((s) => <li key={s.id}><a href={s.recordUrl} lang={s.titleLocale}>{s.title}</a>{s.pageUrl && <> · <a href={s.pageUrl}>Page {s.page}</a></>} <small>[c:{s.id}]</small></li>)}</ol> : <p>No readable source citations are available.</p>}
  </section>
}
