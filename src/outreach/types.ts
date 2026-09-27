export const PLATFORMS = ['blog', 'x', 'instagram', 'linkedin', 'press_note', 'student_explainer'] as const
export type Platform = typeof PLATFORMS[number]
export const TOPICS = ['ice', 'climate', 'oceans', 'life_in_antarctica', 'stations', 'expeditions'] as const
export type Topic = typeof TOPICS[number]
export type Language = 'en' | 'hi'
export type EvidenceChunk = { id: string | number; text: string; heading?: string | null }
export type PromptMedia = { id: string | number; caption?: string | null; alt?: string | null; credit?: string | null }
export type QuizQuestion = { question: string; options: string[]; answer_index: number; explanation: string; chunk_id: string }
export type GenerationItem = {
  platform: Platform; language: Language; title: string; body: string; dateline: string; about: string
  thread: string[]; hashtags: string[]; quiz: QuizQuestion[]; suggested_media: string | null
  cited_chunk_ids: string[]; topic: Topic | null
}
export type GenerationChecks = { schema: boolean; citations: boolean; numbers: boolean; length: boolean; language: boolean; translation: boolean }
export type CheckedGenerationItem = { item: GenerationItem; checks: GenerationChecks; issues: string[] }
