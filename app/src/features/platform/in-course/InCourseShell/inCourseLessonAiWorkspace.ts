import type { Language } from '~/server/repositories/types'

/** Latest row from `api.codeImprove.latestForTask`; shape narrowed for editor / variant UI. */
type LatestImproveRowLike = {
  id?: string | null | undefined
  finishedAt?: string | Date | null | undefined
  improvedCode?: string | null | undefined
  explanationMarkdown?: string | null | undefined
}

type LiveImproveJobLike = {
  status?: string | null
  /** Wire/API language tag — compare with `Language` after narrowing. */
  language?: string | null
  improvedCode?: string | null | undefined
}

export function getLatestImproveRowForLanguage(
  lang: Language,
  py: LatestImproveRowLike | undefined | null,
  php: LatestImproveRowLike | undefined | null
): LatestImproveRowLike | undefined | null {
  return lang === 'python' ? py : php
}

export function hasImprovementForLanguage(params: {
  lang: Language
  latestSaved: LatestImproveRowLike | undefined | null
  liveJob: LiveImproveJobLike | undefined | null
}): boolean {
  const code = params.latestSaved?.improvedCode
  if (typeof code === 'string' && code.trim().length > 0) return true
  const job = params.liveJob
  if (job?.status !== 'DONE') return false
  const jobLang = job.language
  if (jobLang === 'python' || jobLang === 'php') return jobLang === params.lang
  return false
}
