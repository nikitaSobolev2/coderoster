'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Button, SegmentedControl, Tabs } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faPlay } from '@fortawesome/free-solid-svg-icons'
import CodeEditor from '~/features/platform/in-course/CodeEditor'
import ExecutionPanel, { type ExecutionState } from '~/features/platform/in-course/ExecutionPanel'
import EmptyState from '~/shared/components/ui/EmptyState'
import Markdown from '~/shared/components/ui/Markdown'
import { mapTerminalExecutionRecordToView } from '~/shared/lib/executionTerminalView'
import { api } from '~/trpc/react'
import { useExecutionPollGuards } from '~/features/platform/hooks/useExecutionPollGuards'
import type { ExecutionRecord, Language, RunResult } from '~/server/repositories/types'
import styles from './styles.module.scss'

interface WeeklyTaskView {
  id: string
  title: string
  description: string
  estimatedMinutes: number
  initialData: Record<string, unknown>
}

export interface WeeklyAttemptView {
  taskIndex: number
  status: 'PENDING' | 'ACTIVE' | 'SUCCESS'
  solvedAt: Date | null
}

export interface Props {
  initialIsoWeek: string
  initialTasks: WeeklyTaskView[]
  initialAttempts: WeeklyAttemptView[]
  isAuthenticated: boolean
}

export default function WeeklyShell({
  initialIsoWeek,
  initialTasks,
  initialAttempts,
  isAuthenticated
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const weeklyQuery = api.weekly.getCurrent.useQuery(undefined, {
    initialData: { isoWeek: initialIsoWeek, tasks: initialTasks, attempts: initialAttempts },
    refetchOnWindowFocus: false
  })

  const tasks = weeklyQuery.data?.tasks ?? []
  const attempts = weeklyQuery.data?.attempts ?? []
  const isoWeek = weeklyQuery.data?.isoWeek ?? initialIsoWeek

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="Недельные задачи ещё не сгенерированы"
        hint="Заглядывай в понедельник — пул из пяти заданий обновляется автоматически."
      />
    )
  }

  return (
    <div className={styles.shell}>
      <header className={styles.shell__head}>
        <div>
          <h2 className={styles.shell__title}>Спидраны недели {isoWeek}</h2>
          <p className={styles.shell__copy}>
            Пять заданий повышенной сложности. Сдай все — получишь уникальную ачивку и крупный бонус
            XP.
          </p>
        </div>
      </header>

      <Tabs
        value={String(activeIndex)}
        onChange={value => setActiveIndex(Number(value ?? 0))}
        classNames={{
          list: styles.tabs__list,
          tab: styles.tabs__tab,
          panel: styles.tabs__panel
        }}
      >
        <Tabs.List>
          {tasks.map((task, index) => {
            const attempt = attempts.find((a: WeeklyAttemptView) => a.taskIndex === index)
            return (
              <Tabs.Tab key={task.id} value={String(index)}>
                <span className={styles.tabs__tabLabel}>
                  Задача {index + 1}
                  {attempt?.status === 'SUCCESS' ? (
                    <Badge color="green" size="xs" variant="light">
                      <FontAwesomeIcon icon={faCircleCheck} />
                    </Badge>
                  ) : null}
                </span>
              </Tabs.Tab>
            )
          })}
        </Tabs.List>

        {tasks.map((task, index) => (
          <Tabs.Panel key={task.id} value={String(index)}>
            <WeeklyTaskPanel
              task={task}
              taskIndex={index}
              attempt={attempts.find((a: WeeklyAttemptView) => a.taskIndex === index) ?? null}
              isAuthenticated={isAuthenticated}
            />
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  )
}

function WeeklyTaskPanel({
  task,
  taskIndex,
  attempt,
  isAuthenticated
}: {
  task: WeeklyTaskView
  taskIndex: number
  attempt: WeeklyAttemptView | null
  isAuthenticated: boolean
}) {
  const initial = useMemo(() => extractInitial(task.initialData), [task.initialData])
  const [language, setLanguage] = useState<Language>(initial.language)
  const [code, setCode] = useState<string>(initial.starter)
  const [executionState, setExecutionState] = useState<ExecutionState>('idle')
  const [executionResult, setExecutionResult] = useState<RunResult | null>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [executionId, setExecutionId] = useState<string | null>(null)
  const utils = api.useUtils()

  const abortExecutionPoll = useCallback((message: string) => {
    setExecutionError(message)
    setExecutionState('done')
  }, [])

  const submitMutation = api.weekly.submit.useMutation({
    onMutate: () => {
      setExecutionState('running')
      setExecutionResult(null)
      setExecutionError(null)
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
    onAbort: abortExecutionPoll
  })

  useEffect(() => {
    const record = pollQuery.data
    if (!record || !isTerminal(record.status)) return
    const { result, errorMessage } = mapTerminalExecutionRecordToView(record)
    setExecutionResult(result)
    setExecutionError(errorMessage)
    setExecutionState('done')
    if (result?.passed) {
      notifications.show({ color: 'green', message: 'Сдано!' })
      void utils.weekly.getCurrent.invalidate()
    }
  }, [pollQuery.data, utils])

  const isCleared = attempt?.status === 'SUCCESS'

  function handleSubmit() {
    if (!isAuthenticated) {
      notifications.show({ color: 'orange', message: 'Войдите, чтобы сдавать спидраны.' })
      return
    }
    submitMutation.mutate({ taskIndex, language, code })
  }

  return (
    <div className={styles.panel}>
      <article className={styles.panel__brief}>
        <h3 className={styles.panel__title}>{task.title}</h3>
        <div className={styles.panel__markdown}>
          <Markdown source={task.description} />
        </div>
        {isCleared ? (
          <Badge color="green" variant="light">
            Зачтено
          </Badge>
        ) : null}
      </article>

      <div className={styles.panel__editorWrap}>
        <header className={styles.panel__editorHead}>
          <SegmentedControl
            value={language}
            onChange={value => setLanguage(value as Language)}
            data={[
              { value: 'python', label: 'Python' },
              { value: 'php', label: 'PHP' }
            ]}
            size="xs"
          />
          <Button
            leftSection={<FontAwesomeIcon icon={faPlay} />}
            loading={submitMutation.isPending || executionState === 'running'}
            onClick={handleSubmit}
            disabled={isCleared}
          >
            {isCleared ? 'Уже сдано' : 'Сдать'}
          </Button>
        </header>
        <div className={styles.panel__editor}>
          <CodeEditor value={code} onChange={setCode} language={language} />
        </div>
      </div>

      <ExecutionPanel
        state={executionState}
        result={executionResult}
        errorMessage={executionError}
      />
    </div>
  )
}

function extractInitial(initialData: unknown): { language: Language; starter: string } {
  const map = (initialData ?? {}) as { language?: string; predefinedCode?: string }
  const language: Language = map.language === 'php' ? 'php' : 'python'
  return {
    language,
    starter: map.predefinedCode ?? '# Реши задачу и сдай\n'
  }
}

function isTerminal(status: ExecutionRecord['status']): boolean {
  return status !== 'queued' && status !== 'running'
}
