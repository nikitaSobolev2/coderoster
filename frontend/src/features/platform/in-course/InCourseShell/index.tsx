'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, SegmentedControl, Tooltip } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faCircleCheck,
  faPlay,
  faRotateLeft
} from '@fortawesome/free-solid-svg-icons'
import { api } from '~/trpc/react'
import type { CourseDetail, LessonDetail, Language, RunResult } from '~/server/repositories/types'
import TaskNav from '../TaskNav'
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

/**
 * Top-level orchestrator for the in-course experience. Owns the editor draft,
 * execution state, and progress mutations; each pane is a presentational
 * component fed by props.
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
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(initialCompletedLessonIds)

  const { code, setCode, reset } = useDraftPersistence(
    lesson.id,
    lesson.starterCode,
    isAuthenticated
  )

  const runMutation = api.execution.run.useMutation({
    onMutate: () => {
      setExecutionState('running')
      setExecutionError(null)
    },
    onSuccess: result => {
      setExecutionResult(result)
      setExecutionState('done')
      if (result.passed) {
        notifications.show({ color: 'green', message: 'Тесты пройдены. Можно отметить готово.' })
      }
    },
    onError: error => {
      setExecutionError(error.message)
      setExecutionState('done')
    }
  })

  const completeMutation = api.progress.markComplete.useMutation({
    onSuccess: () => {
      setCompletedLessonIds(ids => (ids.includes(lesson.id) ? ids : [...ids, lesson.id]))
      notifications.show({ color: 'green', message: 'Урок отмечен пройденным.' })
    }
  })

  const isCompleted = completedLessonIds.includes(lesson.id)
  const canMarkComplete = isAuthenticated && executionResult?.passed && !isCompleted

  function handleRun() {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    runMutation.mutate({ taskId: lesson.id, language, code })
  }

  function handleNextLesson() {
    if (!lesson.nextLessonId) return
    router.push(`/learn/${course.slug}/${lesson.nextLessonId}`)
  }

  return (
    <div className={styles.shell}>
      <TaskNav
        course={course}
        currentLessonId={lesson.id}
        completedLessonIds={completedLessonIds}
      />
      <TaskPane lesson={lesson} />
      <section className={styles.workspace}>
        <header className={styles.workspace__head}>
          <div className={styles.workspace__lang}>
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
              leftSection={<FontAwesomeIcon icon={faPlay} />}
              loading={runMutation.isPending}
              onClick={handleRun}
            >
              Запустить
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
          />
        </div>

        <footer className={styles.workspace__foot}>
          <span className={styles.workspace__hint}>
            {isCompleted
              ? 'Урок уже отмечен пройденным.'
              : 'Запусти код и пройди тесты, чтобы отметить готово.'}
          </span>
          <div className={styles.workspace__footActions}>
            <Button
              variant="default"
              disabled={!canMarkComplete}
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
