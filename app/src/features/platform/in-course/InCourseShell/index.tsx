'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMediaQuery } from '@mantine/hooks'
import {
  Button,
  Group,
  Paper,
  Popover,
  SegmentedControl,
  Stack,
  Text,
  Title,
  Tooltip
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import clsx from 'clsx'
import { Panel, PanelGroup, type ImperativePanelHandle } from 'react-resizable-panels'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faCircleCheck,
  faFlagCheckered,
  faLock,
  faPlay,
  faRobot,
  faRotateLeft
} from '@fortawesome/free-solid-svg-icons'
import { api } from '~/trpc/react'
import type {
  CourseDetail,
  ExecutionRecord,
  Language,
  LessonDetail,
  RunResult
} from '~/server/repositories/types'
import { mapTerminalExecutionRecordToView } from '~/shared/lib/executionTerminalView'
import TaskNav from '../TaskNav'
import MobileTaskNavTrigger from '../TaskNav/MobileTaskNavTrigger'
import TaskPane from '../TaskPane'
import type { TaskPaneTab } from '../TaskPane'
import taskPaneStyles from '../TaskPane/styles.module.scss'
import CodeEditor from '../CodeEditor'
import ExecutionPanel, { type ExecutionState } from '../ExecutionPanel'
import { usePerLanguageDraftPersistence } from '../usePerLanguageDraftPersistence'
import CodeImproveHeaderTrigger from './CodeImproveHeaderTrigger'
import InCoursePanelResizeHandle from '../layout/InCoursePanelResizeHandle'
import {
  IN_COURSE_HORIZONTAL_AUTOSAVE_ID,
  NAV_PANEL,
  TASK_PANEL,
  WORKSPACE_PANEL
} from '../layout/inCoursePanelConstants'
import WorkspaceEditorExecutionSplit from '../WorkspaceEditorExecutionSplit'
import { useExecutionPollGuards } from '~/features/platform/hooks/useExecutionPollGuards'
import styles from './styles.module.scss'

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

function aiNextLessonNudgeStorageKey(courseSlug: string, lessonId: string): string {
  return `coderoster.aiNextLessonNudgeShown.${courseSlug}.${lessonId}`
}

export default function InCourseShell({
  course,
  lesson,
  isAuthenticated,
  initialCompletedLessonIds,
  viewerIsAdmin = false
}: Props) {
  const router = useRouter()
  const utils = api.useUtils()
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

  const planQuery = api.plan.getMine.useQuery(undefined, { staleTime: 60_000 })
  const viewerTier = planQuery.data?.tierLevel ?? 0

  const desktopPanels = useMediaQuery('(min-width: 769px)', true)
  const [navRailCollapsed, setNavRailCollapsed] = useState(false)
  const navPanelRef = useRef<ImperativePanelHandle>(null)

  const handleCourseHorizontalLayout = useCallback((sizes: number[]) => {
    const navApi = navPanelRef.current
    if (!navApi) return
    const navPct = sizes[0] ?? 0
    if (navApi.isCollapsed()) {
      setNavRailCollapsed(true)
      return
    }
    setNavRailCollapsed(false)
    if (navPct > 0 && navPct < NAV_PANEL.snapCollapseBelow) {
      queueMicrotask(() => navApi.collapse())
    }
  }, [])

  const attemptQuery = api.progress.getTaskAttemptStatus.useQuery(
    { lessonId: lesson.id },
    { enabled: lesson.kind === 'task', staleTime: 15_000 }
  )
  const attemptIsSuccess = attemptQuery.data === 'SUCCESS'

  const aiJobQuery = api.codeImprove.getJob.useQuery(
    { jobId: aiJobId ?? '' },
    {
      enabled: Boolean(aiJobId),
      refetchInterval: q => {
        const row = q.state.data
        if (!row) return 800
        if (row.status === 'DONE' || row.status === 'FAILED') return false
        return 800
      }
    }
  )
  const liveAiJob = aiJobQuery.data

  const { drafts, setDraftForLanguage, resetLanguage } = usePerLanguageDraftPersistence(
    lesson.id,
    lesson.starterCodes,
    lesson.allowedLanguages,
    isAuthenticated
  )

  const canUseEditor = lesson.userCanAccess

  const aiLessonUnlocked =
    lesson.kind === 'task' && attemptIsSuccess && canUseEditor && (viewerTier > 0 || viewerIsAdmin)

  const qLatestPy = api.codeImprove.latestForTask.useQuery(
    { taskId: lesson.id, language: 'python' },
    {
      enabled: aiLessonUnlocked && lesson.allowedLanguages.includes('python'),
      staleTime: 30_000
    }
  )
  const qLatestPhp = api.codeImprove.latestForTask.useQuery(
    { taskId: lesson.id, language: 'php' },
    {
      enabled: aiLessonUnlocked && lesson.allowedLanguages.includes('php'),
      staleTime: 30_000
    }
  )

  function latestSavedAi(lang: Language) {
    return lang === 'python' ? qLatestPy.data : qLatestPhp.data
  }

  function hasImprovementForLanguage(lang: Language): boolean {
    const code = latestSavedAi(lang)?.improvedCode
    if (typeof code === 'string' && code.trim().length > 0) return true
    if (liveAiJob?.status !== 'DONE') return false
    const jobLang = liveAiJob.language as Language | undefined
    if (jobLang === 'python' || jobLang === 'php') return jobLang === lang
    return false
  }

  const taskHasAnySavedImprovement = lesson.allowedLanguages.some(lang => {
    const c = latestSavedAi(lang)?.improvedCode
    return typeof c === 'string' && c.trim().length > 0
  })

  const liveAiHasUsableImprovement =
    liveAiJob?.status === 'DONE' &&
    typeof liveAiJob?.improvedCode === 'string' &&
    liveAiJob.improvedCode.trim().length > 0

  /** At least one allowed language has a completed ИИ-разбор with code (DB or latest DONE job). */
  const taskHasAnyGeneratedAiResponse = taskHasAnySavedImprovement || liveAiHasUsableImprovement

  useEffect(() => {
    setAiJobId(null)
    setAiNextNudgePopoverOpened(false)
    setLeftPaneTab('assignment')
    const first = lesson.allowedLanguages[0]!
    setEditorLanguage(first)
    setSolutionVariant('draft')
    setAiJobTargetLanguage(null)
    lastImprovedScratchSyncKeyByLang.current = {}
    setImprovedScratchByLang({})
  }, [lesson.id])

  useEffect(() => {
    if (!attemptIsSuccess || (viewerTier <= 0 && !viewerIsAdmin)) {
      setAiNextNudgePopoverOpened(false)
    }
  }, [attemptIsSuccess, viewerTier, viewerIsAdmin])

  const isTerminal = (status: ExecutionRecord['status']): boolean =>
    status !== 'queued' && status !== 'running'

  const applyExecutionRecord = (record: ExecutionRecord) => {
    const { result, errorMessage } = mapTerminalExecutionRecordToView(record)
    setExecutionResult(result)
    setExecutionError(errorMessage)
    setExecutionState('done')
    if (result && record.mode === 'submit' && result.passed) {
      void attemptQuery.refetch()
    }
    if (result && record.mode === 'submit') {
      if (result.passed) {
        notifications.show({
          color: 'green',
          message: 'Все тесты пройдены — задача зачтена.'
        })
      } else {
        notifications.show({
          color: 'orange',
          message: 'Часть тестов провалена. Попробуй ещё раз.'
        })
      }
    }
  }

  const abortExecutionPoll = useCallback((message: string) => {
    setExecutionError(message)
    setExecutionState('done')
  }, [])

  const runMutation = api.execution.run.useMutation({
    onMutate: () => {
      setExecutionState('running')
      setExecutionError(null)
      setExecutionResult(null)
      setExecutionId(null)
    },
    onSuccess: data => setExecutionId(data.executionId),
    onError: error => {
      setExecutionError(error.message)
      setExecutionState('done')
    }
  })

  const regenerateAiMutation = api.codeImprove.regenerateLatest.useMutation({
    onSuccess: (data, { language }) => {
      if (data.jobId) {
        setAiJobId(data.jobId)
        setSolutionVariant('improved')
        setLeftPaneTab('assignment')
        void utils.codeImprove.getJob.invalidate({ jobId: data.jobId })
        void utils.codeImprove.latestForTask.invalidate({ taskId: lesson.id, language })
      } else {
        notifications.show({
          color: 'orange',
          title: 'ИИ-разбор',
          message: 'Нет завершённого разбора для этого языка — сначала запусти «Улучши код».'
        })
      }
    },
    onError: error => {
      notifications.show({ color: 'red', title: 'Перегенерация', message: error.message })
    }
  })

  const startAiMutation = api.codeImprove.start.useMutation({
    onSuccess: data => {
      setAiJobId(data.jobId)
      setSolutionVariant('improved')
      setLeftPaneTab('assignment')
      void utils.codeImprove.getJob.invalidate({ jobId: data.jobId })
    },
    onError: error => {
      notifications.show({ color: 'red', title: 'ИИ-разбор', message: error.message })
    }
  })

  const pollQuery = api.execution.get.useQuery(
    { executionId: executionId ?? '' },
    {
      enabled: executionId !== null,
      refetchInterval: query => {
        const record = query.state.data
        return record && isTerminal(record.status) ? false : 750
      },
      refetchOnWindowFocus: false,
      retry: 1,
      retryDelay: 400
    }
  )

  useExecutionPollGuards({
    phase: executionState,
    executionId,
    pollFailed: pollQuery.isError,
    pollErrorMessage: pollQuery.error?.message,
    onAbort: abortExecutionPoll,
    staleAfterMs: 180_000
  })

  useEffect(() => {
    const record = pollQuery.data
    if (!record || !isTerminal(record.status)) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    applyExecutionRecord(record)
  }, [pollQuery.data])

  const completeMutation = api.progress.markComplete.useMutation({
    onSuccess: () => {
      setCompletedLessonIds(ids => (ids.includes(lesson.id) ? ids : [...ids, lesson.id]))
      void attemptQuery.refetch()
      notifications.show({ color: 'green', message: 'Урок отмечен пройденным.' })
    }
  })

  const isCompleted = completedLessonIds.includes(lesson.id)
  const submitPassed = executionMode === 'submit' && executionResult?.passed === true

  const savedAiForEditor = latestSavedAi(editorLanguage)

  const streamJobLanguage =
    liveAiJob?.language === 'python' || liveAiJob?.language === 'php' ? liveAiJob.language : null
  const useTerminalResult = liveAiJob?.status === 'DONE' && streamJobLanguage === editorLanguage

  const improvedCode =
    useTerminalResult && liveAiJob
      ? liveAiJob.improvedCode
      : (savedAiForEditor?.improvedCode ?? null)

  const explanationMarkdown =
    useTerminalResult && liveAiJob
      ? liveAiJob.explanationMarkdown
      : (savedAiForEditor?.explanationMarkdown ?? null)

  const improvedCanonicalStr = typeof improvedCode === 'string' ? improvedCode : ''

  const improvedVersionKeyForEditor: string | null =
    useTerminalResult && liveAiJob?.id
      ? `live:${liveAiJob.id}:${String(liveAiJob.finishedAt ?? '')}`
      : savedAiForEditor?.id
        ? `db:${savedAiForEditor.id}:${String(savedAiForEditor.finishedAt ?? '')}`
        : null

  useEffect(() => {
    if (solutionVariant !== 'improved' || !improvedVersionKeyForEditor) return
    const lang = editorLanguage
    const prevKey = lastImprovedScratchSyncKeyByLang.current[lang]
    if (prevKey === improvedVersionKeyForEditor) return
    lastImprovedScratchSyncKeyByLang.current[lang] = improvedVersionKeyForEditor
    setImprovedScratchByLang(prevMap => ({
      ...prevMap,
      [lang]: improvedCanonicalStr
    }))
  }, [solutionVariant, editorLanguage, improvedVersionKeyForEditor, improvedCanonicalStr])

  /** Latest DONE row from API (may exist while improvedCode still empty during regen). */
  const hasStoredCodeImproveJob = Boolean(savedAiForEditor)
  const showRegenerateForAdmin =
    viewerIsAdmin &&
    aiLessonUnlocked &&
    lesson.kind === 'task' &&
    (hasImprovementForLanguage(editorLanguage) || hasStoredCodeImproveJob)
  const showImproveCodeTrigger =
    aiLessonUnlocked &&
    lesson.kind === 'task' &&
    !hasImprovementForLanguage(editorLanguage) &&
    !(viewerIsAdmin && hasStoredCodeImproveJob)

  const showTaskAiChrome =
    aiLessonUnlocked &&
    lesson.kind === 'task' &&
    (Boolean(aiJobId) ||
      startAiMutation.isPending ||
      regenerateAiMutation.isPending ||
      taskHasAnyGeneratedAiResponse)

  const showExplanationPaneTab = showTaskAiChrome

  const aiImproveBusy =
    startAiMutation.isPending ||
    regenerateAiMutation.isPending ||
    (Boolean(aiJobId) &&
      (!liveAiJob || (liveAiJob.status !== 'DONE' && liveAiJob.status !== 'FAILED')))

  const liveJobLang =
    liveAiJob?.language === 'python' || liveAiJob?.language === 'php' ? liveAiJob.language : null

  const aiBusyTargetingEditor =
    aiImproveBusy &&
    (aiJobTargetLanguage === editorLanguage ||
      (liveJobLang !== null && liveJobLang === editorLanguage))

  const canShowVariantSwitch = showTaskAiChrome

  useEffect(() => {
    if (!canShowVariantSwitch && solutionVariant === 'improved') {
      setSolutionVariant('draft')
    }
  }, [canShowVariantSwitch, solutionVariant])

  useEffect(() => {
    if (liveAiJob?.status !== 'DONE') return
    const lang =
      liveAiJob.language === 'python' || liveAiJob.language === 'php'
        ? liveAiJob.language
        : editorLanguage
    if (!lang) return
    setLeftPaneTab('explanation')
    void utils.codeImprove.latestForTask.invalidate({
      taskId: lesson.id,
      language: lang
    })
  }, [
    liveAiJob?.status,
    liveAiJob?.language,
    editorLanguage,
    lesson.id,
    utils.codeImprove.latestForTask
  ])

  function dispatchExecution(mode: Mode) {
    if (!canUseEditor) {
      notifications.show({
        color: 'yellow',
        message: 'Нужен более высокий тариф для этого урока.'
      })
      return
    }
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    const langForRun = editorLanguage
    const improvedPlay =
      solutionVariant === 'improved'
        ? (improvedScratchByLang[editorLanguage] ?? improvedCanonicalStr)
        : ''
    const codeForRun =
      solutionVariant === 'improved' &&
      typeof improvedPlay === 'string' &&
      improvedPlay.trim().length > 0
        ? improvedPlay
        : (drafts[langForRun] ?? lesson.starterCodes[langForRun] ?? '')

    setExecutionMode(mode)
    runMutation.mutate({
      taskId: lesson.id,
      language: langForRun,
      code: codeForRun,
      mode,
      context: { kind: 'course', ref: course.slug }
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
    if (!lesson.nextLessonId) return
    const key = aiNextLessonNudgeStorageKey(course.slug, lesson.id)
    let nudgeShownBefore = false
    try {
      nudgeShownBefore = localStorage.getItem(key) === '1'
    } catch {
      /* ignore */
    }

    const eligibleForNudge =
      lesson.kind === 'task' &&
      attemptIsSuccess &&
      (viewerTier > 0 || viewerIsAdmin) &&
      canUseEditor &&
      !hasImprovementForLanguage(editorLanguage)

    if (!eligibleForNudge || nudgeShownBefore) {
      router.push(`/learn/${course.slug}/${lesson.nextLessonId}`)
      return
    }

    try {
      localStorage.setItem(key, '1')
    } catch {
      /* ignore */
    }
    setAiNextNudgePopoverOpened(true)
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
      ? (improvedScratchByLang[editorLanguage] ?? improvedCanonicalStr)
      : (drafts[editorLanguage] ?? lesson.starterCodes[editorLanguage] ?? '')

  const readOnlyEditor = !canUseEditor

  function selectEditorLanguage(next: Language) {
    setEditorLanguage(next)
    setSolutionVariant('draft')
  }

  const hasDisplayableImprovedCode =
    typeof improvedCode === 'string' && improvedCode.trim().length > 0

  const improvedFailedThisLang =
    solutionVariant === 'improved' &&
    liveAiJob?.status === 'FAILED' &&
    liveJobLang === editorLanguage

  const showImprovedMissingForLanguageMessage =
    solutionVariant === 'improved' &&
    showTaskAiChrome &&
    !hasImprovementForLanguage(editorLanguage) &&
    !aiBusyTargetingEditor &&
    !improvedFailedThisLang

  const explanationWhenEmpty: 'waiting' | 'no_lang' =
    showTaskAiChrome &&
    !explanationMarkdown?.trim() &&
    taskHasAnyGeneratedAiResponse &&
    !hasImprovementForLanguage(editorLanguage) &&
    !aiBusyTargetingEditor
      ? 'no_lang'
      : 'waiting'

  const workspaceEditorSlot = (
    <>
      {solutionVariant === 'improved' && improvedFailedThisLang ? (
        <Text size="sm" c="red" px="sm" pt="xs" pb={4}>
          {liveAiJob.errorCode === 'NO_API_KEY'
            ? 'Не задан ключ API для ИИ.'
            : liveAiJob.explanationMarkdown?.trim() ||
              (liveAiJob.errorCode ?? 'Ошибка разбора')}
        </Text>
      ) : null}
      {solutionVariant === 'improved' &&
      !improvedFailedThisLang &&
      aiBusyTargetingEditor &&
      !hasDisplayableImprovedCode ? (
        <Text size="sm" c="dimmed" px="sm" pt="xs" pb={4}>
          ИИ формирует улучшенный код…
        </Text>
      ) : null}
      {showImprovedMissingForLanguageMessage ? (
        <Text size="sm" c="dimmed" px="sm" py="md">
          Для выбранного языка пока нет ИИ-улучшения. Переключи язык с готовым разбором или запусти
          «Улучши код» для этого языка.
        </Text>
      ) : improvedFailedThisLang ||
        (solutionVariant === 'improved' &&
          aiBusyTargetingEditor &&
          !hasDisplayableImprovedCode) ? null : (
        <CodeEditor
          key={
            solutionVariant === 'improved'
              ? `ai-suggestion:${editorLanguage}`
              : `user-draft:${editorLanguage}`
          }
          value={editorValue}
          onChange={v => {
            if (solutionVariant === 'draft') setDraftForLanguage(editorLanguage, v)
            else setImprovedScratchByLang(prev => ({ ...prev, [editorLanguage]: v }))
          }}
          language={editorLanguage}
          readOnly={readOnlyEditor}
        />
      )}
    </>
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
      paneTab={leftPaneTab}
      onPaneTabChange={setLeftPaneTab}
      explanationMarkdown={explanationMarkdown ?? null}
      showExplanationTab={showExplanationPaneTab}
      explanationWhenEmpty={explanationWhenEmpty}
    />
  )

  const workspaceSectionEl = (
    <section
      className={clsx(
        styles.workspace,
        desktopPanels ? styles.workspace_desktopColumn : styles.workspace_mobileLayout
      )}
    >
        {!canUseEditor ? (
          <Paper className={styles.workspace__lock} radius="md" shadow="sm">
            <Stack align="center" gap="md">
              <FontAwesomeIcon icon={faLock} className={styles.workspace__lockIcon} />
              <Title order={3} ta="center" className={styles.workspace__lockTitle}>
                Урок по тарифу выше
              </Title>
              <Text size="sm" c="dimmed" ta="center" maw={360}>
                Нужен план минимум уровня {lesson.requiredPlanTier}. Оформи подписку и вернись —
                прогресс и черновики сохранятся.
              </Text>
              <Button component={Link} href="/plans" variant="default">
                Смотреть тарифы
              </Button>
            </Stack>
          </Paper>
        ) : null}

        <header className={styles.workspace__head}>
          <div className={styles.workspace__lang}>
            <MobileTaskNavTrigger
              course={course}
              currentLessonId={lesson.id}
              completedLessonIds={completedLessonIds}
              viewerEffectiveTier={viewerTier}
            />
            <div className={styles.workspace__langTools}>
              <SegmentedControl
                size="xs"
                radius="md"
                disabled={!canUseEditor}
                value={editorLanguage}
                onChange={value => selectEditorLanguage(value as Language)}
                data={lesson.allowedLanguages.map(lang => ({
                  value: lang,
                  label: LANGUAGE_LABEL[lang]
                }))}
              />
              {canShowVariantSwitch ? (
                <div className={styles.workspace__variantIslandWrap}>
                  <div
                    className={taskPaneStyles.pane__island}
                    role="tablist"
                    aria-label="Вариант решения"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={solutionVariant === 'draft'}
                      className={clsx(
                        taskPaneStyles.pane__islandBtn,
                        solutionVariant === 'draft' && taskPaneStyles.pane__islandBtnActive
                      )}
                      onClick={() => setSolutionVariant('draft')}
                    >
                      Твой вариант
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={solutionVariant === 'improved'}
                      className={clsx(
                        taskPaneStyles.pane__islandBtn,
                        taskPaneStyles.pane__islandBtnExplanation,
                        solutionVariant === 'improved' &&
                          taskPaneStyles.pane__islandBtnExplanationActive
                      )}
                      onClick={() => setSolutionVariant('improved')}
                    >
                      Улучшенный вариант
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className={styles.workspace__actions}>
            <Tooltip label="Сбросить к стартовому коду (текущий язык)" position="bottom" withArrow>
              <Button
                variant="subtle"
                onClick={() => {
                  if (solutionVariant === 'draft') resetLanguage(editorLanguage)
                }}
                size="xs"
                disabled={!canUseEditor || solutionVariant === 'improved'}
              >
                <FontAwesomeIcon icon={faRotateLeft} />
              </Button>
            </Tooltip>
            {showImproveCodeTrigger ? (
              <CodeImproveHeaderTrigger
                variant="improve"
                attemptIsSuccess={attemptIsSuccess}
                hasPaidPlan={viewerTier > 0 || viewerIsAdmin}
                startBusy={aiImproveBusy}
                onImproveClick={handleStartAi}
                disabled={!canUseEditor}
              />
            ) : null}
            {showRegenerateForAdmin ? (
              <CodeImproveHeaderTrigger
                variant="regenerate"
                attemptIsSuccess
                hasPaidPlan
                startBusy={regenerateAiMutation.isPending || aiImproveBusy}
                onImproveClick={handleRegenerateAi}
                disabled={!canUseEditor}
              />
            ) : null}
            <Button
              variant="default"
              leftSection={<FontAwesomeIcon icon={faPlay} />}
              loading={runMutation.isPending && executionMode === 'run'}
              onClick={() => dispatchExecution('run')}
              disabled={!canUseEditor}
            >
              Запустить
            </Button>
            <Button
              leftSection={<FontAwesomeIcon icon={faFlagCheckered} />}
              loading={runMutation.isPending && executionMode === 'submit'}
              onClick={() => dispatchExecution('submit')}
              disabled={!canUseEditor}
            >
              Проверить
            </Button>
          </div>
        </header>

        <WorkspaceEditorExecutionSplit
          desktopPanels={desktopPanels}
          editorSlot={workspaceEditorSlot}
          executionSlot={workspaceExecutionSlot}
        />

        <footer className={styles.workspace__foot}>
          <span className={styles.workspace__hint}>
            {isCompleted
              ? 'Урок уже отмечен пройденным.'
              : submitPassed
                ? 'Тесты пройдены — отметь готово или иди дальше.'
                : 'Запусти, чтобы посмотреть вывод. Проверь — чтобы прогнать тесты.'}
          </span>
          <div className={styles.workspace__footActions}>
            <Button
              variant="default"
              disabled={!submitPassed || isCompleted || !canUseEditor}
              loading={completeMutation.isPending}
              leftSection={<FontAwesomeIcon icon={faCircleCheck} />}
              onClick={handleMarkComplete}
            >
              Отметить готово
            </Button>
            <Popover
              opened={aiNextNudgePopoverOpened}
              onChange={setAiNextNudgePopoverOpened}
              position="top-end"
              shadow="md"
              middlewares={{
                flip: { fallbackPlacements: ['bottom-end', 'top-start'] },
                shift: { padding: 8 }
              }}
              classNames={{ dropdown: styles.nextLessonAiNudgeDropdown }}
            >
              <Popover.Target>
                <Button
                  disabled={!lesson.nextLessonId}
                  rightSection={<FontAwesomeIcon icon={faArrowRight} />}
                  onClick={handleNextLesson}
                >
                  Следующий урок
                </Button>
              </Popover.Target>
              <Popover.Dropdown>
                <Stack gap="sm">
                  <Text size="sm" fw={600}>
                    Улучшить код с ИИ?
                  </Text>
                  <Text size="sm" c="dimmed">
                    Задача уже принята тестами. Можно сразу перейти дальше или попросить ИИ
                    предложить аккуратный рефакторинг и короткое пояснение — так проще закреплять
                    практику.
                  </Text>
                  <Group justify="flex-end" gap="xs" wrap="wrap">
                    <Button variant="default" size="xs" onClick={handleAiNextNudgeSkip}>
                      Пропустить
                    </Button>
                    <Button
                      size="xs"
                      leftSection={<FontAwesomeIcon icon={faRobot} />}
                      onClick={handleAiNextNudgeTry}
                      loading={aiImproveBusy}
                    >
                      Попробовать
                    </Button>
                  </Group>
                  <Text size="xs" c="dimmed">
                    Нажми «Следующий урок» ещё раз, чтобы перейти без разбора.
                  </Text>
                </Stack>
              </Popover.Dropdown>
            </Popover>
          </div>
        </footer>
      </section>
  )

  return (
    <div
      className={clsx(
        styles.shell,
        desktopPanels ? styles.shell_panelRoot : styles.shell_gridRoot
      )}
    >
      {desktopPanels ? (
        <PanelGroup
          direction="horizontal"
          autoSaveId={IN_COURSE_HORIZONTAL_AUTOSAVE_ID}
          className={styles.panelGroupHorizontal}
          onLayout={handleCourseHorizontalLayout}
        >
          <Panel
            ref={navPanelRef}
            id="in-course-nav"
            collapsible
            collapsedSize={NAV_PANEL.collapsedSize}
            minSize={NAV_PANEL.minSize}
            maxSize={NAV_PANEL.maxSize}
            defaultSize={NAV_PANEL.defaultSize}
            className={styles.panelCell}
            onCollapse={() => setNavRailCollapsed(true)}
            onExpand={() => setNavRailCollapsed(false)}
          >
            <TaskNav
              course={course}
              currentLessonId={lesson.id}
              completedLessonIds={completedLessonIds}
              viewerEffectiveTier={viewerTier}
              minimal={navRailCollapsed}
            />
          </Panel>
          <InCoursePanelResizeHandle
            orientation="vertical"
            resizeHandleId="in-course-split-nav-task"
          />
          <Panel
            id="in-course-task"
            defaultSize={TASK_PANEL.defaultSize}
            minSize={TASK_PANEL.minSize}
            maxSize={TASK_PANEL.maxSize}
            className={styles.panelCell}
          >
            {taskPaneEl}
          </Panel>
          <InCoursePanelResizeHandle
            orientation="vertical"
            resizeHandleId="in-course-split-task-workspace"
          />
          <Panel
            id="in-course-workspace"
            defaultSize={WORKSPACE_PANEL.defaultSize}
            minSize={WORKSPACE_PANEL.minSize}
            maxSize={WORKSPACE_PANEL.maxSize}
            className={styles.panelCell}
          >
            {workspaceSectionEl}
          </Panel>
        </PanelGroup>
      ) : (
        <>
          <aside className={styles.shell__nav}>
            <TaskNav
              course={course}
              currentLessonId={lesson.id}
              completedLessonIds={completedLessonIds}
              viewerEffectiveTier={viewerTier}
            />
          </aside>
          {taskPaneEl}
          {workspaceSectionEl}
        </>
      )}
    </div>
  )
}
