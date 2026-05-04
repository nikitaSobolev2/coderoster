import type { Language, LessonDetail } from '~/server/repositories/types'
import {
  getLatestImproveRowForLanguage,
  hasImprovementForLanguage
} from './inCourseLessonAiWorkspace'
import type { LatestRowLike, LiveAiJobLike } from './inCourseShellWorkspaceShapes'

export type { LatestRowLike, LiveAiJobLike } from './inCourseShellWorkspaceShapes'

type LatestRowGetter = (lang: Language) => LatestRowLike | undefined | null

function buildLatestRowGetter(
  latestPy: LatestRowLike | undefined | null,
  latestPhp: LatestRowLike | undefined | null
): LatestRowGetter {
  return (lang: Language) => getLatestImproveRowForLanguage(lang, latestPy, latestPhp)
}

export interface InCourseLessonWorkspaceDerivedInput {
  lesson: LessonDetail
  editorLanguage: Language
  solutionVariant: 'draft' | 'improved'
  viewerTier: number
  viewerIsAdmin: boolean
  attemptIsSuccess: boolean
  aiLessonUnlocked: boolean
  liveAiJob: LiveAiJobLike | undefined | null
  latestPy: LatestRowLike | undefined | null
  latestPhp: LatestRowLike | undefined | null
  aiJobId: string | null
  startAiPending: boolean
  regenerateAiPending: boolean
  aiJobTargetLanguage: Language | null
}

export interface InCourseLessonWorkspaceDerivedModel {
  savedAiForEditor: LatestRowLike | undefined | null
  improvedCode: string | null
  explanationMarkdown: string | null
  improvedCanonicalStr: string
  improvedVersionKeyForEditor: string | null
  hasStoredCodeImproveJob: boolean
  showRegenerateForAdmin: boolean
  showImproveCodeTrigger: boolean
  showTaskAiChrome: boolean
  showExplanationPaneTab: boolean
  aiImproveBusy: boolean
  liveJobLang: Language | null
  aiBusyTargetingEditor: boolean
  canShowVariantSwitch: boolean
  hasDisplayableImprovedCode: boolean
  improvedFailedThisLang: boolean
  showImprovedMissingForLanguageMessage: boolean
  explanationWhenEmpty: 'waiting' | 'no_lang'
  editorAiImprovementReady: boolean
}

function normalizedLatestLanguage(jobLang: string | null | undefined): Language | null {
  return jobLang === 'python' || jobLang === 'php' ? jobLang : null
}

function improvementKeysAndBodies(params: {
  liveAiJob: LiveAiJobLike | undefined | null
  savedAiForEditor: LatestRowLike | undefined | null
  editorLanguage: Language
}) {
  const { liveAiJob, savedAiForEditor, editorLanguage } = params
  const liveJobLang = normalizedLatestLanguage(liveAiJob?.language ?? null)
  const useTerminalResult = liveAiJob?.status === 'DONE' && liveJobLang === editorLanguage

  const improvedCode =
    useTerminalResult && liveAiJob
      ? (liveAiJob.improvedCode ?? null)
      : (savedAiForEditor?.improvedCode ?? null)

  const explanationMarkdown =
    useTerminalResult && liveAiJob
      ? (liveAiJob.explanationMarkdown ?? null)
      : (savedAiForEditor?.explanationMarkdown ?? null)

  const improvedCanonicalStr = typeof improvedCode === 'string' ? improvedCode : ''

  let improvedVersionKeyForEditor: string | null = null
  if (useTerminalResult && liveAiJob?.id) {
    improvedVersionKeyForEditor = `live:${liveAiJob.id}:${String(liveAiJob.finishedAt ?? '')}`
  } else if (savedAiForEditor?.id) {
    improvedVersionKeyForEditor = `db:${savedAiForEditor.id}:${String(savedAiForEditor.finishedAt ?? '')}`
  }

  return {
    liveJobLang,
    improvedCode,
    explanationMarkdown,
    improvedCanonicalStr,
    improvedVersionKeyForEditor
  }
}

function computeEditorAiSignals(
  input: Pick<
    InCourseLessonWorkspaceDerivedInput,
    | 'lesson'
    | 'editorLanguage'
    | 'liveAiJob'
    | 'latestPy'
    | 'latestPhp'
    | 'aiJobId'
    | 'startAiPending'
    | 'regenerateAiPending'
    | 'aiJobTargetLanguage'
    | 'aiLessonUnlocked'
  >
): {
  latestRow: LatestRowGetter
  editorAiImprovementReady: boolean
  taskHasAnyGeneratedAiResponse: boolean
  showTaskAiChrome: boolean
  aiImproveBusy: boolean
  liveJobLang: Language | null
  aiBusyTargetingEditor: boolean
} {
  const latestRow = buildLatestRowGetter(input.latestPy, input.latestPhp)
  const editorAiImprovementReady = hasImprovementForLanguage({
    lang: input.editorLanguage,
    latestSaved: latestRow(input.editorLanguage),
    liveJob: input.liveAiJob
  })

  const taskHasAnySavedImprovement = input.lesson.allowedLanguages.some(lang => {
    const c = latestRow(lang)?.improvedCode
    return typeof c === 'string' && c.trim().length > 0
  })

  const liveAiJob = input.liveAiJob
  const liveAiHasUsableImprovement =
    liveAiJob?.status === 'DONE' &&
    typeof liveAiJob?.improvedCode === 'string' &&
    liveAiJob.improvedCode.trim().length > 0

  const taskHasAnyGeneratedAiResponse = taskHasAnySavedImprovement || liveAiHasUsableImprovement

  const showTaskAiChrome =
    input.aiLessonUnlocked &&
    input.lesson.kind === 'task' &&
    [
      input.aiJobId,
      input.startAiPending,
      input.regenerateAiPending,
      taskHasAnyGeneratedAiResponse
    ].some(Boolean)

  const liveJobLang = normalizedLatestLanguage(liveAiJob?.language ?? null)

  const pollingNonTerminalAiJob =
    Boolean(input.aiJobId) &&
    (liveAiJob == null ? true : liveAiJob.status !== 'DONE' && liveAiJob.status !== 'FAILED')

  const aiImproveBusy = [
    input.startAiPending,
    input.regenerateAiPending,
    pollingNonTerminalAiJob
  ].some(Boolean)

  const aiBusyTargetingEditor =
    aiImproveBusy &&
    (input.aiJobTargetLanguage === input.editorLanguage ||
      (liveJobLang !== null && liveJobLang === input.editorLanguage))

  return {
    latestRow,
    editorAiImprovementReady,
    taskHasAnyGeneratedAiResponse,
    showTaskAiChrome,
    aiImproveBusy,
    liveJobLang,
    aiBusyTargetingEditor
  }
}

export function deriveInCourseLessonWorkspaceModel(
  input: InCourseLessonWorkspaceDerivedInput
): InCourseLessonWorkspaceDerivedModel {
  const { lesson, editorLanguage, solutionVariant, liveAiJob } = input

  const signals = computeEditorAiSignals(input)
  const savedAiForEditor = signals.latestRow(editorLanguage)
  const bodies = improvementKeysAndBodies({
    liveAiJob,
    savedAiForEditor,
    editorLanguage
  })

  const hasStoredCodeImproveJob = Boolean(savedAiForEditor)
  const showRegenerateForAdmin =
    input.viewerIsAdmin &&
    input.aiLessonUnlocked &&
    lesson.kind === 'task' &&
    (signals.editorAiImprovementReady || hasStoredCodeImproveJob)
  const showImproveCodeTrigger =
    input.aiLessonUnlocked &&
    lesson.kind === 'task' &&
    !signals.editorAiImprovementReady &&
    !(input.viewerIsAdmin && hasStoredCodeImproveJob)

  const hasDisplayableImprovedCode =
    typeof bodies.improvedCode === 'string' && bodies.improvedCode.trim().length > 0

  const improvedFailedThisLang =
    solutionVariant === 'improved' &&
    liveAiJob?.status === 'FAILED' &&
    bodies.liveJobLang === editorLanguage

  const showImprovedMissingForLanguageMessage =
    solutionVariant === 'improved' &&
    signals.showTaskAiChrome &&
    !signals.editorAiImprovementReady &&
    !signals.aiBusyTargetingEditor &&
    !improvedFailedThisLang

  let explanationWhenEmpty: 'waiting' | 'no_lang' = 'waiting'
  if (
    signals.showTaskAiChrome &&
    !bodies.explanationMarkdown?.trim() &&
    signals.taskHasAnyGeneratedAiResponse &&
    !signals.editorAiImprovementReady &&
    !signals.aiBusyTargetingEditor
  ) {
    explanationWhenEmpty = 'no_lang'
  }

  return {
    savedAiForEditor,
    improvedCode: bodies.improvedCode,
    explanationMarkdown: bodies.explanationMarkdown,
    improvedCanonicalStr: bodies.improvedCanonicalStr,
    improvedVersionKeyForEditor: bodies.improvedVersionKeyForEditor,
    hasStoredCodeImproveJob,
    showRegenerateForAdmin,
    showImproveCodeTrigger,
    showTaskAiChrome: signals.showTaskAiChrome,
    showExplanationPaneTab: signals.showTaskAiChrome,
    aiImproveBusy: signals.aiImproveBusy,
    liveJobLang: bodies.liveJobLang,
    aiBusyTargetingEditor: signals.aiBusyTargetingEditor,
    canShowVariantSwitch: signals.showTaskAiChrome,
    hasDisplayableImprovedCode,
    improvedFailedThisLang,
    showImprovedMissingForLanguageMessage,
    explanationWhenEmpty,
    editorAiImprovementReady: signals.editorAiImprovementReady
  }
}
