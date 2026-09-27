export type Locale = 'en' | 'hi'
export const COLLECTIONS = ['reports', 'datasets', 'publications', 'media', 'events', 'expeditions', 'stations'] as const
export type ArchiveCollection = (typeof COLLECTIONS)[number]
export type SearchFilters = { q: string; locale: Locale; collection?: ArchiveCollection; region?: string; year?: number; expedition?: number; station?: number; page: number }
export type SearchResult = {
  collection: ArchiveCollection; docId: string; title: string; titleLocale: Locale; url: string;
  locale: Locale; chunkId: string; page: number | null; heading: string | null;
  snippet: string; rank: number; region: string | null; year: number | null
}
export type RetrievedChunk = SearchResult & { text: string }
export type Source = Pick<SearchResult, 'chunkId' | 'collection' | 'docId' | 'title' | 'titleLocale' | 'page' | 'url'>
export type AskAnswer = { status: 'answered' | 'not_found'; locale: Locale; answer: string; sentences: string[]; sources: Source[]; suggestedSearches: string[]; cached: boolean }
