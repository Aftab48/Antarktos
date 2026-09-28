// Shared class strings for server and client components (client files can't import ui.tsx, which reaches the DB).
export const h1 = 'font-display text-4xl text-balance sm:text-5xl'
export const h2Base = 'font-display text-2xl sm:text-4xl'
export const h2 = `mb-6 ${h2Base}`
export const h3 = 'text-[1.3125rem] font-semibold leading-snug'

// Button text is a verb phrase; no trailing arrows (spec §5).
export const btn =
  'inline-flex min-h-11 items-center justify-center rounded-md bg-night px-5 text-center font-semibold text-snow no-underline hover:bg-deep disabled:cursor-not-allowed disabled:opacity-60'
export const btnSecondary =
  'inline-flex min-h-11 items-center justify-center rounded-md border border-control bg-snow px-5 text-center font-semibold text-night no-underline hover:bg-ice disabled:cursor-not-allowed disabled:opacity-60'

// Numbered source tiles: record summaries, ask answers, outreach posts (spec §9.8).
export const sourceList = 'mt-4 divide-y divide-rule border-y border-rule'
export const sourceItem = 'grid scroll-mt-24 grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-4 py-4'
export const sourceNum = 'flex size-10 items-center justify-center rounded-md bg-ice font-display font-figures text-xl'

// Whole-row click target: the link's ::after covers the row; the row shows the focus ring instead of the link.
export const rowFocus = 'has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-signal'
