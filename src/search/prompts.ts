import { readFileSync } from 'node:fs'
import path from 'node:path'

export const ASK_PROMPT_VERSION = 'ask-v1.2'
export const KEYWORD_PROMPT_VERSION = 'keywords-v1'

// Literal paths allow Next's file tracing to include the versioned prompt artifacts.
const askPrompt = readFileSync(path.join(process.cwd(), 'src/search/ask-v1.md'), 'utf8')
const keywordPrompt = readFileSync(path.join(process.cwd(), 'src/search/keywords-v1.md'), 'utf8')

export type QuestionLocale = 'en' | 'hi'
export type AskPromptChunk = { id: string | number; text: string; heading?: string | null }
export type PromptMessage = { role: 'system' | 'user'; content: string }

export function questionLocale(question: string, fallback: QuestionLocale = 'en'): QuestionLocale {
  if (/[\u0900-\u097f]/u.test(question)) return 'hi'
  return /[a-z]/iu.test(question) ? 'en' : fallback
}

export function buildAskMessages(question: string, chunks: AskPromptChunk[], fallback: QuestionLocale = 'en'): PromptMessage[] {
  if (chunks.length > 8) throw new Error('Ask accepts at most 8 retrieved chunks')
  const ids = new Set<string>()
  const evidence = chunks.map(({ id, text, heading }) => {
    const key = String(id)
    if (!/^[1-9]\d*$/u.test(key) || ids.has(key)) throw new Error('Ask chunk IDs must be unique positive integers')
    ids.add(key)
    return { id: key, heading: heading ?? null, text }
  })
  return [
    { role: 'system', content: askPrompt },
    { role: 'user', content: JSON.stringify({ question, question_language: questionLocale(question, fallback), chunks: evidence }) },
  ]
}

export function buildKeywordMessages(question: string, fallback: QuestionLocale = 'en'): PromptMessage[] {
  return [
    { role: 'system', content: keywordPrompt },
    { role: 'user', content: JSON.stringify({ question, question_language: questionLocale(question, fallback) }) },
  ]
}
