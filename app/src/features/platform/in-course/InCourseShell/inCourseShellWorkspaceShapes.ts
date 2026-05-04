/**
 * Structural shapes shared by TRPC bundle types and workspace derivation.
 * Kept server-free so type-aware ESLint can resolve them in `index.tsx`.
 */
export type LiveAiJobLike = {
  status?: string | null
  language?: string | null
  improvedCode?: string | null
  explanationMarkdown?: string | null
  id?: string | null
  finishedAt?: string | Date | null
  errorCode?: string | null
}

export type LatestRowLike = {
  id?: string | null
  finishedAt?: string | Date | null
  improvedCode?: string | null
  explanationMarkdown?: string | null
}
