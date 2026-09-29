'use client'
// Header dark-mode switch. The inline script in [lang]/layout.tsx sets the class on <html> before first
// paint; this button flips it and remembers the choice in this browser only.
import { useEffect, useState } from 'react'

export function ThemeToggle({ label }: { label: string }) {
  const [dark, setDark] = useState(false)
  useEffect(() => setDark(document.documentElement.classList.contains('dark')), [])

  const flip = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {} // private mode: the choice lasts until the next page load
    setDark(next)
  }

  return (
    <button
      type="button"
      aria-pressed={dark}
      aria-label={label}
      title={label}
      onClick={flip}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-frost/60 text-snow hover:bg-deep"
    >
      {/* The icon follows the class via `dark:`, so it is right before hydration too. */}
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 dark:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="hidden size-5 dark:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  )
}
