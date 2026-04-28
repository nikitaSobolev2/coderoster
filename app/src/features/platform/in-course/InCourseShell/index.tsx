'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, SegmentedControl, Tooltip } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faCircleCheck,
  faFlagCheckered,
  faPlay,
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
import CodeEditor from '../CodeEditor'
import ExecutionPanel, { type ExecutionState } from '../ExecutionPanel'
import { useDraftPersistence } from '../useDraftPersistence'
import styles from './styles.module.scss'

export interface Props {
  course: CourseDetail
  lesson: LessonDetail
  isAuthenticated: boolean
  initialCompletedLessonIds: string[]
}

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'php', label: 'PHP' }
]

type Mode = 'run' | 'submit'

/**
 * Top-level orchestrator for the in-course experience. Owns the editor draft,
 * execution state, and progress mutations; each pane is a presentational
 * component fed by props.
 *
 * Two distinct actions:
 *  - `Запустить` (mode=run) — runs the code without grading; stdout / stderr
 *    update in the panel but no progress is recorded.
 *  - `Проверить` (mode=submit) — sends the code with the lesson's autotests;
 *    the consumer increments `tryN`, marks the attempt SUCCESS on full pass,
 *    and advances enrollment + achievements.
 */
export default function InCourseShell({
  course,
  lesson,
  isAuthenticated,
  initialCompletedLessonIds
}: Props) {
  const router = useRouter()
  const [language, setLanguage] = useState<Language>(lesson.language)
  const [executionState, setExecutionState] = useState<ExecutionState>('idle')
  const [executionResult, setExecutionResult] = useState<RunResult | null>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [executionId, setExecutionId] = useState<string | null>(null)
  const [executionMode, setExecutionMode] = useState<Mode>('run')
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(initialCompletedLessonIds)

  const { code, setCode, reset } = useDraftPersistence(
    lesson.id,
    lesson.starterCode,
    isAuthenticated
  )

  const isTerminal = (status: ExecutionRecord['status']): boolean =>
    status !== 'queued' && status !== 'running'

  const applyExecutionRecord = (record: ExecutionRecord) => {
    const { result, errorMessage } = mapTerminalExecutionRecordToView(record)
    setExecutionResult(result)
    setExecutionError(errorMessage)
    setExecutionState('done')
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

  const pollQuery = api.execution.get.useQuery(
    { executionId: executionId ?? '' },
    {
      enabled: executionId !== null,
      refetchInterval: query => {
        const record = query.state.data
        return record && isTerminal(record.status) ? false : 750
      },
      refetchOnWindowFocus: false
    }
  )

  useEffect(() => {
    const record = pollQuery.data
    if (!record || !isTerminal(record.status)) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    applyExecutionRecord(record)
  }, [pollQuery.data])

  const completeMutation = api.progress.markComplete.useMutation({
    onSuccess: () => {
      setCompletedLessonIds(ids => (ids.includes(lesson.id) ? ids : [...ids, lesson.id]))
      notifications.show({ color: 'green', message: 'Урок отмечен пройденным.' })
    }
  })

  const isCompleted = completedLessonIds.includes(lesson.id)
  const submitPassed = executionMode === 'submit' && executionResult?.passed === true

  function dispatchExecution(mode: Mode) {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    setExecutionMode(mode)
    runMutation.mutate({
      taskId: lesson.id,
      language,
      code,
      mode,
      context: { kind: 'course', ref: course.slug }
    })
  }

  function handleNextLesson() {
    if (!lesson.nextLessonId) return
    router.push(`/learn/${course.slug}/${lesson.nextLessonId}`)
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.shell__nav}>
        <TaskNav
          course={course}
          currentLessonId={lesson.id}
          completedLessonIds={completedLessonIds}
        />
      </aside>
      <TaskPane lesson={lesson} />
      <section className={styles.workspace}>
        <header className={styles.workspace__head}>
          <div className={styles.workspace__lang}>
            <MobileTaskNavTrigger
              course={course}
              currentLessonId={lesson.id}
              completedLessonIds={completedLessonIds}
            />
            <SegmentedControl
              value={language}
              onChange={value => setLanguage(value as Language)}
              data={LANGUAGE_OPTIONS}
              size="xs"
              radius="md"
            />
          </div>
          <div className={styles.workspace__actions}>
            <Tooltip label="Сбросить к стартовому коду" position="bottom" withArrow>
              <Button variant="subtle" onClick={reset} size="xs">
                <FontAwesomeIcon icon={faRotateLeft} />
              </Button>
            </Tooltip>
            <Button
              variant="default"
              leftSection={<FontAwesomeIcon icon={faPlay} />}
              loading={runMutation.isPending && executionMode === 'run'}
              onClick={() => dispatchExecution('run')}
            >
              Запустить
            </Button>
            <Button
              leftSection={<FontAwesomeIcon icon={faFlagCheckered} />}
              loading={runMutation.isPending && executionMode === 'submit'}
              onClick={() => dispatchExecution('submit')}
            >
              Проверить
            </Button>
          </div>
        </header>

        <div className={styles.workspace__editor}>
          <CodeEditor value={code} onChange={setCode} language={language} />
        </div>

        <div className={styles.workspace__execution}>
          <ExecutionPanel
            state={executionState}
            result={executionResult}
            errorMessage={executionError}
            mode={executionMode}
          />
        </div>

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
              disabled={!submitPassed || isCompleted}
              loading={completeMutation.isPending}
              leftSection={<FontAwesomeIcon icon={faCircleCheck} />}
              onClick={() => completeMutation.mutate({ lessonId: lesson.id })}
            >
              Отметить готово
            </Button>
            <Button
              disabled={!lesson.nextLessonId}
              rightSection={<FontAwesomeIcon icon={faArrowRight} />}
              onClick={handleNextLesson}
            >
              Следующий урок
            </Button>
          </div>
        </footer>
      </section>
    </div>
  )
}
