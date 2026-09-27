import type { GenerationItem, CheckedGenerationItem, EvidenceChunk, PromptMedia, Language } from './types'
import { validateGenerationPack } from './validate'
import { GenerationError, type GenerationRequest } from './request'

export type GenerationEnvelope = { choices: { finish_reason: string | null; message: { content: string | null } }[] }
export type GenerationResult = { requestId: string; status: 'complete'; posts: { id: number; platform: string; language: string; checks: CheckedGenerationItem['checks']; issues: string[] }[] }
export type GenerationEvidence = { chunks: EvidenceChunk[]; media: PromptMedia[] }
export type GenerationDependencies = {
  reserve: (input: GenerationRequest) => Promise<GenerationResult | null>;
  evidence: (input: GenerationRequest) => Promise<GenerationEvidence>;
  saveEvidence: (evidence: GenerationEvidence) => Promise<void>;
  complete: (language: Language, evidence: GenerationEvidence, english?: GenerationItem[]) => Promise<GenerationEnvelope>;
  saveRaw: (language: Language, raw: GenerationEnvelope) => Promise<void>;
  saveItem: (item: CheckedGenerationItem) => Promise<number>;
  finish: (result: GenerationResult) => Promise<void>;
  fail: () => Promise<void>;
}

// A durable request reservation is taken before any paid call. A repeated request never
// generates twice, including after a timeout or a partial draft save.
export async function generateOutreach(input: GenerationRequest, deps: GenerationDependencies): Promise<GenerationResult> {
  const cached = await deps.reserve(input)
  if (cached) return cached
  try {
    const evidence = await deps.evidence(input)
    if (!evidence.chunks.length) throw new GenerationError('no_source_chunks', 422)
    await deps.saveEvidence(evidence)
    const englishRaw = await deps.complete('en', evidence)
    await deps.saveRaw('en', englishRaw)
    const english = validateGenerationPack(englishRaw.choices[0]?.finish_reason === 'stop' ? englishRaw.choices[0]?.message.content : null,
      { platforms: input.platforms, language: 'en', chunks: evidence.chunks, mediaIds: evidence.media.map((m) => m.id) })
    const checked: CheckedGenerationItem[] = input.languages.includes('en') ? [...english.items] : []
    if (input.languages.includes('hi')) {
      // Never translate a malformed English pack. The validator produces visible
      // diagnostic drafts for the requested Hindi items without another paid call.
      let hindiContent: unknown = null
      if (!english.schemaErrors.length && english.items.every((i) => i.checks.schema)) {
        const hindiRaw = await deps.complete('hi', evidence, english.items.map((i) => i.item))
        await deps.saveRaw('hi', hindiRaw)
        if (hindiRaw.choices[0]?.finish_reason === 'stop') hindiContent = hindiRaw.choices[0]?.message.content
      }
      checked.push(...validateGenerationPack(hindiContent, { platforms: input.platforms, language: 'hi', chunks: evidence.chunks,
        mediaIds: evidence.media.map((m) => m.id), englishItems: english.items.map((i) => i.item) }).items)
    }
    const result: GenerationResult = { requestId: input.requestId, status: 'complete', posts: [] }
    for (const item of checked) result.posts.push({ id: await deps.saveItem(item), platform: item.item.platform, language: item.item.language, checks: item.checks, issues: item.issues })
    await deps.finish(result)
    return result
  } catch (error) {
    await deps.fail()
    throw error
  }
}
