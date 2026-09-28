'use client'

import { useState } from 'react'
import { btnSecondary } from '../../_lib/classes'
import { translator, type Locale } from '@/i18n'
import { copyText, linkedInIntent, xIntent } from '@/outreach/presentation'

type Post = { language?: Locale; id: number; platform: string; title?: string; body: string; hashtags?: string[]; thread?: { text: string }[]; dateline?: string; about?: string; suggested_media?: unknown; cardAvailable?: boolean }

export function ShareActions({ post, l }: { post: Post; l: Locale }) {
  const t = translator(l)
  const [message, setMessage] = useState('')
  const [manualCopy, setManualCopy] = useState(false)
  const text = copyText(post)
  async function copy() {
    try { await navigator.clipboard.writeText(text); setMessage(t('outreach.copied')); setManualCopy(false) }
    catch { setMessage(t('outreach.copyManual')); setManualCopy(true) }
  }
  // LinkedIn shares the current public detail URL. It does not prefill the post body.
  function shareLinkedIn() { window.open(linkedInIntent(window.location.href), '_blank', 'noopener,noreferrer') }
  return <section aria-label={t('outreach.share')} className="my-8 rounded-xl bg-ice p-5">
    <div className="flex flex-wrap gap-3">
      <button type="button" className={btnSecondary} onClick={copy}>{t('outreach.copy')}</button>
      {post.platform === 'x' && <a className={btnSecondary} href={xIntent(copyText({ body: post.body, hashtags: post.hashtags }))} target="_blank" rel="noopener noreferrer">{t('outreach.shareX')}</a>}
      {post.platform === 'linkedin' && <button type="button" className={btnSecondary} onClick={shareLinkedIn}>{t('outreach.shareLinkedIn')}</button>}
      {post.platform === 'instagram' && !!post.suggested_media && <a className={btnSecondary} href={`/api/outreach-image/${post.id}`}>{t('outreach.downloadImage')}</a>}
      {post.cardAvailable && <a className={btnSecondary} href={`/api/instagram-card/${post.id}`}>{t('outreach.downloadCard')}</a>}
    </div>
    {post.platform === 'linkedin' && <p className="mt-3 text-sm text-slate">{t('outreach.linkedInHint')}</p>}
    {post.platform === 'x' && !!post.thread?.length && <div className="mt-3 flex flex-wrap gap-3">{post.thread.slice(1).map((item, i) => <a key={i} className="inline-flex min-h-11 items-center text-sm underline" href={xIntent(copyText({ body: item.text }))} target="_blank" rel="noopener noreferrer">{t('outreach.shareThread', { n: i + 2 })}</a>)}</div>}
    <p role="status" aria-live="polite" className="mt-2 text-sm">{message}</p>
    {manualCopy && <label className="mt-2 block text-sm">{t('outreach.copy')}<textarea lang={post.language ?? l} readOnly value={text} onFocus={(e) => e.target.select()} rows={7} className="mt-2 w-full rounded-md border border-control bg-snow p-3" /></label>}
  </section>
}
