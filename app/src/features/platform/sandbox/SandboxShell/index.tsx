'use client'

import { useEffect, useState } from 'react'
import { Button, SegmentedControl } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { notifications } from '@mantine/notifications'
import CodeEditor from '~/features/platform/in-course/CodeEditor'
import ExecutionPanel, { type ExecutionState } from '~/features/platform/in-course/ExecutionPanel'
import type { ExecutionRecord, Language, RunResult } from '~/server/repositories/types'
import { api } from '~/trpc/react'
import styles from './styles.module.scss'

const LANGUAGE_OPTIONS: { value: Language; label: string; starter: string }[] = [
  {
    value: 'python',
    label: 'Python',
    starter: '# Напиши код и нажми Запустить\nprint("Hello, CodeRoster")\n'
  },
  {
    value: 'php',
    label: 'PHP',
    starter: '<?php\necho "Hello, CodeRoster";\n'
  }
]

export interface Props {
  isAuthenticated: boolean
}

/**
 * Free-form code playground. Calls `execution.run` with `mode=run` so nothing
 * gets graded, no XP, no progression — just a fast feedback loop.
 */
export default function SandboxShell({ isAuthenticated }: Props) {
  const [language, setLanguage] = useState<Language>('python')
  const [code, setCode] = useState<string>(LANGUAGE_OPTIONS[0]!.starter)
  const [executionState, setExecutionState] = useState<ExecutionState>('idle')
  const [executionResult, setExecutionResult] = useState<RunResult | null>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [executionId, setExecutionId] = useState<string | null>(null)

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
    if (record.status === 'success') {
      setExecutionResult({
        stdout: record.stdout ?? '',
        stderr: record.stderr ?? '',
        runtimeMs: record.runtimeMs ?? 0,
        passed: false,
        testResults: record.testResults
      })
    } else {
      setExecutionError(record.errorMessage ?? `Ошибка запуска: ${record.status}`)
    }
    setExecutionState('done')
  }, [pollQuery.data])

  function handleRun() {
    if (!isAuthenticated) {
      notifications.show({
        color: 'orange',
        message: 'Чтобы запускать код в Песочнице, нужен аккаунт.'
      })
      return
    }
    runMutation.mutate({
      taskId: null,
      language,
      code,
      mode: 'run',
      context: { kind: 'sandbox', ref: null }
    })
  }

  function handleReset() {
    const starter = LANGUAGE_OPTIONS.find(option => option.value === language)?.starter ?? ''
    setCode(starter)
  }

  return (
    <div className={styles.shell}>
      <header className={styles.shell__head}>
        <SegmentedControl
          value={language}
          onChange={value => {
            const next = value as Language
            setLanguage(next)
            setCode(LANGUAGE_OPTIONS.find(option => option.value === next)?.starter ?? '')
          }}
          data={LANGUAGE_OPTIONS.map(option => ({ value: option.value, label: option.label }))}
          radius="md"
          size="sm"
        />
        <div className={styles.shell__actions}>
          <Button
            variant="subtle"
            leftSection={<FontAwesomeIcon icon={faRotateLeft} />}
            onClick={handleReset}
          >
            Сброс
          </Button>
          <Button
            leftSection={<FontAwesomeIcon icon={faPlay} />}
            loading={runMutation.isPending || executionState === 'running'}
            onClick={handleRun}
          >
            Запустить
          </Button>
        </div>
      </header>

      <div className={styles.shell__editor}>
        <CodeEditor value={code} onChange={setCode} language={language} />
      </div>

      <div className={styles.shell__output}>
        <ExecutionPanel
          state={executionState}
          result={executionResult}
          errorMessage={executionError}
          mode="run"
        />
      </div>
    </div>
  )
}

function isTerminal(status: ExecutionRecord['status']): boolean {
  return status !== 'queued' && status !== 'running'
}
