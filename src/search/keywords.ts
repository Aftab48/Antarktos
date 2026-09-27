// Plain default for question retrieval: zero model calls, bounded OR query.
const stopwords = new Set(`a an the is are was were be been being do does did can could would should will shall may might must have has had what which who whom whose where when why how many much tell me us about please explain describe give find show i we you he she it they them this that these those my our your its of in on at to from for by with and or not as than then there here into during through
क्या कौन किस किसका किसकी किसके किसने किसको किन कहाँ कहां किधर कब क्यों कैसे कैसा कैसी कितने कितना कितनी है हैं था थी थे हो होता होती होते हुआ हुई हुए होना हों में पर से को का की के और या नहीं यह ये वह वे इस उस इन उन मुझे हमें आप तुम मैं हम बारे बताओ बताएं बताइए बताएँ कृपया जानकारी दें दीजिए समझाइए भी तो तक लिए लिये एक करता करती करते किया गई गया गए रही रहा रहे`.split(/\s+/u))

const words = (value: string) => value.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*/gu) ?? []
const usefulWords = (value: string) => [...new Set(words(value).filter((word) => !stopwords.has(word) && [...word].length <= 64))]
const toQuery = (terms: string[]) => terms.map((term) => `"${term}"`).join(' OR ')

export function questionToKeywords(question: string): string {
  return toQuery(usefulWords(question).slice(0, 12))
}

// Optional model output never supplies SQL/search syntax, new terms, or an empty
// result that suppresses useful deterministic terms. Every failure uses plain fallback.
export function parseKeywordResponse(raw: string, question: string): string {
  const fallback = questionToKeywords(question)
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback
    const object = parsed as Record<string, unknown>
    if (Object.keys(object).length !== 1 || !Array.isArray(object.keywords) || object.keywords.length > 12) return fallback
    const allowed = new Set(usefulWords(question))
    const terms: string[] = []
    for (const value of object.keywords) {
      if (typeof value !== 'string') return fallback
      const normalized = value.normalize('NFKC').toLowerCase()
      if (!allowed.has(normalized)) return fallback
      terms.push(normalized)
    }
    return terms.length ? toQuery([...new Set(terms)]) : fallback
  } catch {
    return fallback
  }
}
