import { NextResponse, type NextRequest } from 'next/server'

// English lives at /, Hindi at /hi (plan §5). The public pages sit under app/(frontend)/[lang], so an English
// path is rewritten to /en/…, and /en/… itself redirects to the unprefixed URL. The browser path goes along in
// `x-path` for the language toggle and the nav's current-page marker.
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  if (pathname === '/en' || pathname.startsWith('/en/')) return NextResponse.redirect(new URL((pathname.slice(3) || '/') + search, req.url))
  const headers = new Headers(req.headers)
  headers.set('x-path', pathname + search)
  if (pathname === '/hi' || pathname.startsWith('/hi/')) return NextResponse.next({ request: { headers } })
  return NextResponse.rewrite(new URL(`/en${pathname === '/' ? '' : pathname}${search}`, req.url), { request: { headers } })
}

// Not the Payload admin/API, Next internals, or files (anything with a dot).
export const config = { matcher: ['/((?!admin|api|_next|.*\\..*).*)'] }
