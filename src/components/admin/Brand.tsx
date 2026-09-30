function Mark({ className = 'science-mark' }: { className?: string }) {
  // Same meridian mark as the public site and public/icon.svg: globe, pole-to-pole line, station pin.
  return <svg aria-hidden="true" viewBox="0 0 32 32" className={className}><circle cx="16" cy="16" r="11.5" fill="none" stroke="currentColor" strokeWidth="2.5" /><path d="M16 4.5v23" stroke="currentColor" strokeWidth="2.5" /><circle cx="16" cy="23" r="4" fill="#E4500E" /></svg>
}

export function PortalLogo() {
  return <div className="science-brand"><Mark /><span>Antarktos<span className="science-brand__sub">Archive &amp; outreach workspace</span></span></div>
}

// The breadcrumb gives the icon an 18px box: fill it instead of the 2.7rem logo tile.
export function PortalIcon() { return <Mark className="science-mark science-mark--icon" /> }

export function LoginIntroduction() {
  return <div className="science-login-intro"><p className="science-eyebrow">Staff access</p><h1>Sign in to the workspace</h1><p>Manage archive records, review cited drafts and publish approved outreach.</p><p className="science-muted">Smart India Hackathon 2026 · PS 26063</p></div>
}

export function WorkspaceIntroduction() {
  return <div className="science-workspace-intro"><p className="science-eyebrow">Antarktos · Staff workspace</p><h2>From archive to public understanding</h2><p>Upload and process source records, review citations and checks, then publish approved content.</p></div>
}
