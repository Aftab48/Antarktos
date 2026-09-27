'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { translator, type Locale } from '@/i18n'
import { copyText, linkedInIntent, xIntent } from '@/outreach/presentation'

type Post = { id: number; platform: string; title?: string; body: string; hashtags?: string[]; thread?: { text: string }[]; dateline?: string; about?: string; suggested_media?: unknown }

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
  return <section aria-label={t('outreach.share')} className="my-7 rounded-xl border bg-muted/30 p-4">
    <div className="flex flex-wrap gap-3">
      <Button type="button" variant="outline" onClick={copy}>{t('outreach.copy')}</Button>
      {post.platform === 'x' && <Button asChild variant="outline"><a href={xIntent(copyText({ body: post.body, hashtags: post.hashtags }))} target="_blank" rel="noopener noreferrer">{t('outreach.shareX')}</a></Button>}
      {post.platform === 'linkedin' && <Button type="button" variant="outline" onClick={shareLinkedIn}>{t('outreach.shareLinkedIn')}</Button>}
      {post.platform === 'instagram' && !!post.suggested_media && <Button asChild variant="outline"><a href={`/api/outreach-image/${post.id}`}>{t('outreach.downloadImage')}</a></Button>}
    </div>
    {post.platform === 'linkedin' && <p className="mt-3 text-sm text-muted-foreground">{t('outreach.linkedInHint')}</p>}
    {post.platform === 'x' && !!post.thread?.length && <div className="mt-3 flex flex-wrap gap-3">{post.thread.slice(1).map((item, i) => <a key={i} className="text-sm underline underline-offset-4" href={xIntent(copyText({ body: item.text }))} target="_blank" rel="noopener noreferrer">{t('outreach.shareThread', { n: i + 2 })}</a>)}</div>}
    <p role="status" aria-live="polite" className="mt-2 text-sm">{message}</p>
    {manualCopy && <label className="mt-2 block text-sm">{t('outreach.copy')}<textarea readOnly value={text} onFocus={(e) => e.target.select()} rows={7} className="mt-2 w-full rounded-lg border bg-background p-3" /></label>}
  </section>
}
