import { headers } from 'next/headers'
import { LoadingState } from '../_lib/LoadingState'

export default async function Loading() {
  const path = (await headers()).get('x-path') ?? '/'
  return <LoadingState locale={/^\/hi(?:\/|\?|$)/.test(path) ? 'hi' : 'en'} />
}
