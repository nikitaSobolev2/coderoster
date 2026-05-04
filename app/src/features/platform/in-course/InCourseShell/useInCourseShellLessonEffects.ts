'use client'

import { useEffect, type Dispatch, type SetStateAction } from 'react'
import type { Language } from '~/server/repositories/types'
import type { TaskPaneTab } from '../TaskPane'
import type { SolutionVariantGate } from './inCourseShellSolutionVariant'

type LiveAiJobEffectLike = { status?: string | null; language?: string | null }

/** Mutable ref map (avoid `MutableRefObject` deprecation noise in some linters). */
type ImprovedScratchKeyRef = { current: Partial<Record<Language, string>> }

export interface UseInCourseShellLessonEffectsParams {
  lessonId: string
  firstAllowedLanguage: Language
  attemptIsSuccess: boolean
  viewerTier: number
  viewerIsAdmin: boolean
  setAiJobId: Dispatch<SetStateAction<string | null>>
  setAiNextNudgePopoverOpened: Dispatch<SetStateAction<boolean>>
  setLeftPaneTab: Dispatch<SetStateAction<TaskPaneTab>>
  setEditorLanguage: Dispatch<SetStateAction<Language>>
  setSolutionVariant: Dispatch<SetStateAction<SolutionVariantGate>>
  setAiJobTargetLanguage: Dispatch<SetStateAction<Language | null>>
  lastImprovedScratchSyncKeyByLang: ImprovedScratchKeyRef
  setImprovedScratchByLang: Dispatch<SetStateAction<Partial<Record<Language, string>>>>
  solutionVariant: SolutionVariantGate
  editorLanguage: Language
  improvedVersionKeyForEditor: string | null
  improvedCanonicalStr: string
  canShowVariantSwitch: boolean
  liveAiJob: LiveAiJobEffectLike | undefined | null
  taskLessonId: string
  invalidateLatestForTask: (input: { taskId: string; language: Language }) => Promise<unknown>
}

export function useInCourseShellLessonEffects(p: UseInCourseShellLessonEffectsParams): void {
  const {
    lessonId,
    firstAllowedLanguage,
    attemptIsSuccess,
    viewerTier,
    viewerIsAdmin,
    setAiJobId,
    setAiNextNudgePopoverOpened,
    setLeftPaneTab,
    setEditorLanguage,
    setSolutionVariant,
    setAiJobTargetLanguage,
    lastImprovedScratchSyncKeyByLang,
    setImprovedScratchByLang,
    solutionVariant,
    editorLanguage,
    improvedVersionKeyForEditor,
    improvedCanonicalStr,
    canShowVariantSwitch,
    liveAiJob,
    taskLessonId,
    invalidateLatestForTask
  } = p
  const lastImprovedScratchSyncKeyByLangRef = lastImprovedScratchSyncKeyByLang

  useEffect(() => {
    setAiJobId(null)
    setAiNextNudgePopoverOpened(false)
    setLeftPaneTab('assignment')
    setEditorLanguage(firstAllowedLanguage)
    setSolutionVariant('draft')
    setAiJobTargetLanguage(null)
    lastImprovedScratchSyncKeyByLangRef.current = {}
    setImprovedScratchByLang({})
    // Only `lessonId`: avoid full pane reset when `firstAllowedLanguage` identity churns without navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset strictly on lesson navigation
  }, [lessonId])

  useEffect(() => {
    if (!attemptIsSuccess || (viewerTier <= 0 && !viewerIsAdmin)) {
      setAiNextNudgePopoverOpened(false)
    }
  }, [attemptIsSuccess, viewerIsAdmin, viewerTier, setAiNextNudgePopoverOpened])

  useEffect(() => {
    if (solutionVariant !== 'improved' || !improvedVersionKeyForEditor) return
    const lang = editorLanguage
    const prevKey = lastImprovedScratchSyncKeyByLangRef.current[lang]
    if (prevKey === improvedVersionKeyForEditor) return
    lastImprovedScratchSyncKeyByLangRef.current[lang] = improvedVersionKeyForEditor
    setImprovedScratchByLang(prevMap => ({
      ...prevMap,
      [lang]: improvedCanonicalStr
    }))
  }, [
    solutionVariant,
    editorLanguage,
    improvedVersionKeyForEditor,
    improvedCanonicalStr,
    lastImprovedScratchSyncKeyByLangRef,
    setImprovedScratchByLang
  ])

  useEffect(() => {
    if (!canShowVariantSwitch && solutionVariant === 'improved') {
      setSolutionVariant('draft')
    }
  }, [canShowVariantSwitch, solutionVariant, setSolutionVariant])

  useEffect(() => {
    if (liveAiJob?.status !== 'DONE') return
    const lang: Language =
      liveAiJob.language === 'python' || liveAiJob.language === 'php'
        ? liveAiJob.language
        : editorLanguage
    setLeftPaneTab('explanation')
    void invalidateLatestForTask({
      taskId: taskLessonId,
      language: lang
    })
  }, [
    liveAiJob?.status,
    liveAiJob?.language,
    editorLanguage,
    taskLessonId,
    invalidateLatestForTask,
    setLeftPaneTab
  ])
}
