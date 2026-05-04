'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMediaQuery } from '@mantine/hooks'
import type { CourseDetail, Language, LessonDetail, RunResult } from '~/server/repositories/types'
import TaskPane from '../TaskPane'
import type { TaskPaneTab } from '../TaskPane'
import ExecutionPanel, { type ExecutionState } from '../ExecutionPanel'
import { usePerLanguageDraftPersistence } from '../usePerLanguageDraftPersistence'
import { lessonOrdinalLabel } from '../lib/lessonOrdinalLabel'
import { InCourseShellPanels } from './InCourseShellPanels'
import { InCourseWorkspaceEditorSlot } from './InCourseWorkspaceEditorSlot'
import { InCourseWorkspaceSection } from './InCourseWorkspaceSection'
import { deriveInCourseLessonWorkspaceModel } from './inCourseShellLessonWorkspaceDerived'
import { useInCourseHorizontalPanelRails } from './useInCourseHorizontalPanelRails'
import { useInCourseShellLessonEffects } from './useInCourseShellLessonEffects'
import { useInCourseShellTrpcBundle } from './useInCourseShellTrpcBundle'
import type { UseInCourseShellTrpcParams } from './useInCourseShellTrpc'
import {
  dispatchLessonExecution,
  handleNextLessonClick,
  nextLessonAiNudgeStorageKey
} from './inCourseShellLessonActions'

export interface Props {
  course: CourseDetail
  lesson: LessonDetail
  isAuthenticated: boolean
  initialCompletedLessonIds: string[]
  /** DB `ADMIN` — unlock ИИ-разбор без платного плана и показать «Перегенерировать». */
  viewerIsAdmin?: boolean
}

const LANGUAGE_LABEL: Record<Language, string> = {
  python: 'Python',
  php: 'PHP'
}

type SolutionVariant = 'draft' | 'improved'

type Mode = 'run' | 'submit'

function workspaceFootHintCopy(isCompleted: boolean, submitPassed: boolean): string {
  if (isCompleted) {
    return 'Урок уже отмечен пройденным.'
  }
  if (submitPassed) {
    return 'Тесты пройдены — отметь готово или иди дальше.'
  }
  return 'Запусти, чтобы посмотреть вывод. Проверь — чтобы прогнать тесты.'
}

export default function InCourseShell({
  course,
  lesson,
  isAuthenticated,
  initialCompletedLessonIds,
  viewerIsAdmin = false
}: Readonly<Props>) {
  const router = useRouter()
  const initialLang = lesson.allowedLanguages[0]!

  const [editorLanguage, setEditorLanguage] = useState<Language>(initialLang)
  const [solutionVariant, setSolutionVariant] = useState<SolutionVariant>('draft')
  const [aiJobTargetLanguage, setAiJobTargetLanguage] = useState<Language | null>(null)
  const [leftPaneTab, setLeftPaneTab] = useState<TaskPaneTab>('assignment')

  const [executionState, setExecutionState] = useState<ExecutionState>('idle')
  const [executionResult, setExecutionResult] = useState<RunResult | null>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [executionId, setExecutionId] = useState<string | null>(null)
  const [executionMode, setExecutionMode] = useState<Mode>('run')
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(initialCompletedLessonIds)
  const [aiJobId, setAiJobId] = useState<string | null>(null)
  const [aiNextNudgePopoverOpened, setAiNextNudgePopoverOpened] = useState(false)
  /** Ephemeral buffer for «Улучшенный вариант»; never persisted to draft/DB. */
  const [improvedScratchByLang, setImprovedScratchByLang] = useState<
    Partial<Record<Language, string>>
  >({})
  const lastImprovedScratchSyncKeyByLang = useRef<Partial<Record<Language, string>>>({})

  const desktopPanels = useMediaQuery('(min-width: 769px)', true, {
    getInitialValueInEffect: false
  })
  const {
    horizontalPanelGroupRef,
    navPanelRef,
    taskPanelRef,
    workspacePanelRef,
    handleHorizontalLayout,
    navRailCollapsed,
    taskRailCollapsed,
    workspaceRailCollapsed
  } = useInCourseHorizontalPanelRails(desktopPanels, lesson.id)

  const shellTrpc = useInCourseShellTrpcBundle({
    lesson,
    viewerIsAdmin,
    aiJobId,
    setAiJobId,
    executionId,
    setExecutionId,
    executionState,
    setExecutionState,
    setExecutionError,
    setExecutionResult,
    setSolutionVariant,
    setLeftPaneTab,
    setCompletedLessonIds
  } satisfies Readonly<UseInCourseShellTrpcParams>)
  const {
    utils,
    viewerTier,
    attemptIsSuccess,
    aiLessonUnlocked,
    liveAiJob,
    qLatestPy,
    qLatestPhp,
    runMutation,
    regenerateAiMutation,
    startAiMutation,
    completeMutation
  } = shellTrpc

  const canUseEditor = lesson.userCanAccess

  const { drafts, setDraftForLanguage, resetLanguage } = usePerLanguageDraftPersistence(
    lesson.id,
    lesson.starterCodes,
    lesson.allowedLanguages,
    isAuthenticated,
    { allowDraftPersistence: canUseEditor }
  )

  const d = deriveInCourseLessonWorkspaceModel({
    lesson,
    editorLanguage,
    solutionVariant,
    viewerTier,
    viewerIsAdmin,
    attemptIsSuccess,
    aiLessonUnlocked,
    liveAiJob,
    latestPy: qLatestPy.data,
    latestPhp: qLatestPhp.data,
    aiJobId,
    startAiPending: startAiMutation.isPending,
    regenerateAiPending: regenerateAiMutation.isPending,
    aiJobTargetLanguage
  })

  useInCourseShellLessonEffects({
    lessonId: lesson.id,
    firstAllowedLanguage: lesson.allowedLanguages[0]!,
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
    improvedVersionKeyForEditor: d.improvedVersionKeyForEditor,
    improvedCanonicalStr: d.improvedCanonicalStr,
    canShowVariantSwitch: d.canShowVariantSwitch,
    liveAiJob,
    taskLessonId: lesson.id,
    invalidateLatestForTask: input => utils.codeImprove.latestForTask.invalidate(input)
  })

  const isCompleted = completedLessonIds.includes(lesson.id)
  const submitPassed = executionMode === 'submit' && executionResult?.passed === true

  function dispatchExecution(mode: Mode) {
    dispatchLessonExecution(mode, {
      canUseEditor,
      isAuthenticated,
      pushHref: href => {
        router.push(href)
      },
      editorLanguage,
      solutionVariant,
      improvedScratchByLang,
      improvedCanonicalStr: d.improvedCanonicalStr,
      drafts,
      lesson,
      courseSlug: course.slug,
      setExecutionMode,
      runMutate: input => runMutation.mutate(input)
    })
  }

  function handleStartAi() {
    const lang = editorLanguage
    setAiJobTargetLanguage(lang)
    const dedupeKey = crypto.randomUUID()
    startAiMutation.mutate({ taskId: lesson.id, language: lang, dedupeKey })
  }

  function handleRegenerateAi() {
    const lang = editorLanguage
    setAiJobTargetLanguage(lang)
    regenerateAiMutation.mutate({ taskId: lesson.id, language: lang })
  }

  function handleNextLesson() {
    handleNextLessonClick({
      nudgeStorageKey: nextLessonAiNudgeStorageKey(course.slug, lesson.id),
      courseSlug: course.slug,
      pushHref: href => {
        router.push(href)
      },
      lesson,
      attemptIsSuccess,
      viewerTier,
      viewerIsAdmin,
      canUseEditor,
      editorImprovementReady: d.editorAiImprovementReady,
      setPopoverOpened: setAiNextNudgePopoverOpened
    })
  }

  function handleAiNextNudgeTry() {
    setAiNextNudgePopoverOpened(false)
    handleStartAi()
  }

  function handleAiNextNudgeSkip() {
    setAiNextNudgePopoverOpened(false)
    if (lesson.nextLessonId) {
      router.push(`/learn/${course.slug}/${lesson.nextLessonId}`)
    }
  }

  const handleMarkComplete = () => {
    if (!canUseEditor) return
    completeMutation.mutate({ lessonId: lesson.id })
  }

  const editorValue =
    solutionVariant === 'improved'
      ? (improvedScratchByLang[editorLanguage] ?? d.improvedCanonicalStr)
      : (drafts[editorLanguage] ?? lesson.starterCodes[editorLanguage] ?? '')

  const readOnlyEditor = !canUseEditor

  function selectEditorLanguage(next: Language) {
    setEditorLanguage(next)
    setSolutionVariant('draft')
  }

  const workspaceEditorSlot = (
    <InCourseWorkspaceEditorSlot
      solutionVariant={solutionVariant}
      improvedFailedThisLang={d.improvedFailedThisLang}
      liveAiJobFailure={
        d.improvedFailedThisLang && liveAiJob
          ? {
              errorCode: liveAiJob.errorCode,
              explanationMarkdown: liveAiJob.explanationMarkdown
            }
          : null
      }
      aiBusyTargetingEditor={d.aiBusyTargetingEditor}
      hasDisplayableImprovedCode={d.hasDisplayableImprovedCode}
      showImprovedMissingForLanguageMessage={d.showImprovedMissingForLanguageMessage}
      editorLanguage={editorLanguage}
      editorValue={editorValue}
      readOnlyEditor={readOnlyEditor}
      onEditorValueChange={v => {
        if (solutionVariant === 'draft') setDraftForLanguage(editorLanguage, v)
        else setImprovedScratchByLang(prev => ({ ...prev, [editorLanguage]: v }))
      }}
    />
  )

  const workspaceExecutionSlot = (
    <ExecutionPanel
      state={executionState}
      result={executionResult}
      errorMessage={executionError}
      variant="full"
      gradingMode={executionMode}
    />
  )

  const taskPaneEl = (
    <TaskPane
      lesson={lesson}
      lessonOrdinalLabel={lessonOrdinalLabel(course, lesson.id)}
      paneTab={leftPaneTab}
      onPaneTabChange={setLeftPaneTab}
      explanationMarkdown={d.explanationMarkdown ?? null}
      showExplanationTab={d.showExplanationPaneTab}
      explanationWhenEmpty={d.explanationWhenEmpty}
      collapsedRail={taskRailCollapsed}
    />
  )

  const workspaceSectionEl = (
    <InCourseWorkspaceSection
      desktopPanels={desktopPanels}
      lesson={lesson}
      course={course}
      canUseEditor={canUseEditor}
      completedLessonIds={completedLessonIds}
      viewerTier={viewerTier}
      workspaceFootHintText={workspaceFootHintCopy(isCompleted, submitPassed)}
      editorLanguage={editorLanguage}
      languageSegmentData={lesson.allowedLanguages.map(lang => ({
        value: lang,
        label: LANGUAGE_LABEL[lang]
      }))}
      onEditorLanguageChange={selectEditorLanguage}
      solutionVariant={solutionVariant}
      onSelectDraftVariant={() => setSolutionVariant('draft')}
      onSelectImprovedVariant={() => setSolutionVariant('improved')}
      canShowVariantSwitch={d.canShowVariantSwitch}
      showImproveCodeTrigger={d.showImproveCodeTrigger}
      showRegenerateForAdmin={d.showRegenerateForAdmin}
      attemptIsSuccess={attemptIsSuccess}
      hasPaidPlan={viewerTier > 0 || viewerIsAdmin}
      aiImproveBusy={d.aiImproveBusy}
      regenerateCombinedBusy={[regenerateAiMutation.isPending, d.aiImproveBusy].some(Boolean)}
      onStartAi={handleStartAi}
      onRegenerateAi={handleRegenerateAi}
      onResetCurrentLanguageDraft={() => {
        if (solutionVariant === 'draft') resetLanguage(editorLanguage)
      }}
      executionMode={executionMode}
      runMutationPending={runMutation.isPending}
      onRunClick={() => dispatchExecution('run')}
      onSubmitClick={() => dispatchExecution('submit')}
      editorSlot={workspaceEditorSlot}
      executionSlot={workspaceExecutionSlot}
      submitPassed={submitPassed}
      isCompleted={isCompleted}
      completeMutationPending={completeMutation.isPending}
      onMarkCompleteClick={handleMarkComplete}
      aiNextNudgePopoverOpened={aiNextNudgePopoverOpened}
      onAiNextNudgePopoverChange={setAiNextNudgePopoverOpened}
      onNextLessonClick={handleNextLesson}
      onAiNextNudgeTry={handleAiNextNudgeTry}
      onAiNextNudgeSkip={handleAiNextNudgeSkip}
    />
  )

  return (
    <InCourseShellPanels
      desktopPanels={desktopPanels}
      horizontalPanelGroupRef={horizontalPanelGroupRef}
      navPanelRef={navPanelRef}
      taskPanelRef={taskPanelRef}
      workspacePanelRef={workspacePanelRef}
      handleHorizontalLayout={handleHorizontalLayout}
      navRailCollapsed={navRailCollapsed}
      workspaceRailCollapsedChrome={workspaceRailCollapsed}
      course={course}
      lesson={lesson}
      completedLessonIds={completedLessonIds}
      viewerTier={viewerTier}
      taskPaneEl={taskPaneEl}
      workspaceSectionEl={workspaceSectionEl}
    />
  )
}
