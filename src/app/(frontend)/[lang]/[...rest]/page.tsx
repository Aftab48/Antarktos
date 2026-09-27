import { notFound } from 'next/navigation'

// Any other path under /, /hi renders [lang]/not-found.tsx inside the site layout.
export default function Rest() {
  notFound()
}
