'use client'

import { Drawer, DrawerToggler, useDocumentInfo, useFormModified, useModal } from '@payloadcms/ui'
import { useRef, useState } from 'react'
import { PLATFORMS } from '../../outreach/presentation'

const SLUG = 'generate-outreach'
const names = { blog: 'Blog', x: 'X', instagram: 'Instagram', linkedin: 'LinkedIn', press_note: 'Press note', student_explainer: 'Student explainer + quiz' }

export function GenerateOutreach() {
  const { id, collectionSlug } = useDocumentInfo()
  const { closeModal } = useModal()
  const modified = useFormModified()
  const [platforms, setPlatforms] = useState<string[]>([...PLATFORMS])
  const [languages, setLanguages] = useState<string[]>(['en', 'hi'])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [posts, setPosts] = useState<{ id: number; platform: string; language: string }[]>([])
  // A lost response must retry the same request, never purchase another pack accidentally.
  const request = useRef<{ key: string; id: string } | null>(null)
  const locked = busy || !id || modified
  function toggle(value: string, values: string[], setter: (values: string[]) => void) {
    if (request.current) return
    setter(values.includes(value) ? values.filter((v) => v !== value) : [...values, value])
  }
  async function generate() {
    if (locked || !platforms.length || !languages.length) return
    const key = JSON.stringify({ collection: collectionSlug, id, platforms, languages })
    if (!request.current || request.current.key !== key) request.current = { key, id: crypto.randomUUID() }
    setBusy(true)
    setMessage('Generating drafts. Keep this page open; each selected language uses one model call.')
    try {
      const result = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: request.current.id, collection: collectionSlug, id, platforms, languages }) })
      const data = await result.json()
      if (!result.ok) {
        const errors: Record<string, string> = {
          generation_in_progress: 'This pack is still running. Use Retry to check the same request; no additional pack will be started.',
          previous_failure: 'This request failed. Review the saved diagnostic drafts or server notes before starting another pack.',
          request_conflict: 'This request belongs to a different selection. Reload this page before starting a new pack.',
          no_source_chunks: 'No source chunks are ready. Save and process this record first.',
          forbidden: 'Only signed-in staff can generate outreach.',
        }
        setMessage(errors[data.error] ?? 'Generation could not finish. Retry keeps the same request ID to prevent a duplicate pack.')
      } else {
        setPosts(data.posts ?? [])
        setMessage('Drafts saved. Open each draft to review its checks and citations before approval.')
      }
    } catch { setMessage('The response was interrupted. Retry uses the same request ID to avoid another model call.') }
    finally { setBusy(false) }
  }
  // Payload's drawer: close button, click outside and Escape all close it. A running request keeps going.
  return <>
    <DrawerToggler slug={SLUG} className="science-generate-toggle">Generate outreach</DrawerToggler>
    <Drawer slug={SLUG} title="Generate outreach">
    <div className="science-generate" aria-busy={busy}>
      <p>Generate a cited draft pack from this saved record. Hindi translates the English pack.</p>
      {(!id || modified) && <p role="status">Save your record and any changes before generating outreach.</p>}
      <fieldset disabled={locked || !!request.current} style={{ border: 0, padding: 0 }}>
        <legend>Platforms</legend>
        {PLATFORMS.map((p) => <label key={p} style={{ display: 'block', margin: '0.4rem 0' }}><input type="checkbox" checked={platforms.includes(p)} onChange={() => toggle(p, platforms, setPlatforms)} /> {names[p]}</label>)}
      </fieldset>
      <fieldset disabled={locked || !!request.current} style={{ margin: '1rem 0', border: 0, padding: 0 }}>
        <legend>Languages</legend>
        {(['en', 'hi'] as const).map((l) => <label key={l} style={{ marginRight: '1rem' }}><input type="checkbox" checked={languages.includes(l)} onChange={() => toggle(l, languages, setLanguages)} /> {l === 'en' ? 'English' : 'हिन्दी'}</label>)}
      </fieldset>
      <div className="science-generate__actions">
        <button className="science-action" type="button" disabled={locked || !platforms.length || !languages.length || posts.length > 0} onClick={generate}>{busy ? 'Generating…' : request.current ? 'Retry same request' : 'Generate draft pack'}</button>
        <button className="science-action science-action--secondary" type="button" onClick={() => closeModal(SLUG)}>{posts.length ? 'Close' : 'Cancel'}</button>
      </div>
      <p role="status" aria-live="polite">{message}</p>
      {posts.length > 0 && <ul>{posts.map((p) => <li key={p.id}><a href={`/admin/collections/outreach-posts/${p.id}`}>{p.platform} · {p.language} · Draft {p.id}</a></li>)}</ul>}
    </div>
    </Drawer>
  </>
}
