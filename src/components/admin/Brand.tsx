function Mark() {
  return <svg aria-hidden="true" viewBox="0 0 32 32" className="science-mark"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 3v26M5 9.5l22 13M5 22.5l22-13M12 6l4 3 4-3M12 26l4-3 4 3" /></g></svg>
}

export function PortalLogo() {
  return <div className="science-brand"><Mark /><span>Polar Science Portal<span className="science-brand__sub">Archive &amp; outreach workspace</span></span></div>
}

export function PortalIcon() { return <Mark /> }

export function LoginIntroduction() {
  return <div className="science-login-intro"><p className="science-eyebrow">Staff access</p><h1>Sign in to the workspace</h1><p>Manage archive records, review cited drafts and publish approved outreach.</p><p className="science-muted">SIH 2026 prototype · Not an official government website.</p></div>
}

export function WorkspaceIntroduction() {
  return <div className="science-workspace-intro"><p className="science-eyebrow">Polar Science Portal · Staff workspace</p><h2>From archive to public understanding</h2><p>Upload and process source records, review citations and checks, then publish approved content.</p></div>
}
