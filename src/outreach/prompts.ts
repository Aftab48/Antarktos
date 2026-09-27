import { readFileSync } from 'node:fs'
import path from 'node:path'
import { generationSchema } from './schema'
import { PLATFORMS, type EvidenceChunk, type GenerationItem, type Platform, type PromptMedia } from './types'

export const PROMPT_VERSION = 'outreach-v1.1'
const citationClarification = readFileSync(path.join(process.cwd(), 'src/outreach/citation-v1.1.md'), 'utf8')
const generationPrompt = `${readFileSync(path.join(process.cwd(), 'src/outreach/generate-v1.md'), 'utf8')}\n\n${citationClarification}`
const translationPrompt = `${readFileSync(path.join(process.cwd(), 'src/outreach/translate-v1.md'), 'utf8')}\n\n${citationClarification}`
export type PromptMessage = { role: 'system' | 'user'; content: string }

function evidence(chunks: EvidenceChunk[], media: PromptMedia[]) {
  if (!chunks.length || chunks.length > 12 || chunks.reduce((n, c) => n + c.text.length, 0) > 160000) throw new Error('Generation requires 1–12 chunks and at most 160000 evidence characters.')
  const ids = chunks.map(c => String(c.id))
  if (ids.some(id => !/^[1-9]\d{0,19}$/u.test(id)) || new Set(ids).size !== ids.length) throw new Error('Chunk IDs must be unique positive integers.')
  if (media.length > 30 || media.some(m => !/^[1-9]\d{0,19}$/u.test(String(m.id)))) throw new Error('Invalid linked media.')
  return { chunks: chunks.map(c => ({ id: String(c.id), text: c.text })), media: media.map(m => ({ ...m, id: String(m.id) })) }
}

export function buildGenerationMessages({ platforms, chunks, media = [] }: { platforms: Platform[]; chunks: EvidenceChunk[]; media?: PromptMedia[] }): PromptMessage[] {
  if (!platforms.length || platforms.length > 6 || new Set(platforms).size !== platforms.length || platforms.some(p => !PLATFORMS.includes(p))) throw new Error('Select 1–6 distinct supported platforms.')
  return [
    { role: 'system', content: `${generationPrompt}\n\n# JSON schema\n${JSON.stringify(generationSchema(platforms, 'en'))}` },
    { role: 'user', content: JSON.stringify({ platforms, language: 'en', ...evidence(chunks, media) }) },
  ]
}

export function buildTranslationMessages({ items, chunks, media = [] }: { items: GenerationItem[]; chunks: EvidenceChunk[]; media?: PromptMedia[] }): PromptMessage[] {
  const platforms = items.map(item => item.platform)
  if (!items.length || items.length > 6 || new Set(platforms).size !== platforms.length || items.some(item => item.language !== 'en')) throw new Error('Translation requires a checked English pack.')
  return [
    { role: 'system', content: `${translationPrompt}\n\n# JSON schema\n${JSON.stringify(generationSchema(platforms, 'hi'))}` },
    { role: 'user', content: JSON.stringify({ english_items: items, language: 'hi', ...evidence(chunks, media) }) },
  ]
}
