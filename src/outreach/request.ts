import { COLLECTIONS, type ArchiveCollection } from '../search/types'
import { PLATFORMS, type Platform, type Language } from './types'

export class GenerationError extends Error {
  constructor(public code: string, public status = 400) { super(code) }
}
export type GenerationRequest = { requestId: string; collection: ArchiveCollection; id: number; platforms: Platform[]; languages: Language[] }
export function parseGenerationRequest(input: unknown): GenerationRequest {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new GenerationError('invalid_request')
  const value = input as Record<string, unknown>
  if (Object.keys(value).some((key) => !['requestId', 'collection', 'id', 'platforms', 'languages'].includes(key))) throw new GenerationError('invalid_request')
  if (typeof value.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value.requestId)) throw new GenerationError('invalid_request_id')
  if (!(COLLECTIONS as readonly unknown[]).includes(value.collection)) throw new GenerationError('invalid_source')
  if (!/^[1-9]\d{0,8}$/u.test(String(value.id))) throw new GenerationError('invalid_source')
  if (!Array.isArray(value.platforms) || !value.platforms.length || value.platforms.length > 6 || value.platforms.some((x) => !(PLATFORMS as readonly unknown[]).includes(x))) throw new GenerationError('invalid_platforms')
  if (!Array.isArray(value.languages) || !value.languages.length || value.languages.length > 2 || value.languages.some((x) => x !== 'en' && x !== 'hi')) throw new GenerationError('invalid_languages')
  return { requestId: value.requestId.toLowerCase(), collection: value.collection as ArchiveCollection, id: Number(value.id), platforms: [...new Set(value.platforms)].sort() as Platform[], languages: [...new Set(value.languages)].sort() as Language[] }
}
export function requireSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const configured = process.env.APP_BASE_URL
  const expected = new URL(configured || request.url).origin
  if (!origin || origin !== expected || request.headers.get('sec-fetch-site') === 'cross-site') throw new GenerationError('invalid_origin', 403)
}
