'use client'

import { useEffect, useState } from 'react'
import { Tabs } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faCircleXmark, faSpinner } from '@fortawesome/free-solid-svg-icons'
import type { RunResult } from '~/server/repositories/types'
import TestResultsList from './TestResultsList'
import styles from './styles.module.scss'

export type ExecutionState = 'idle' | 'running' | 'done'

/** Sandbox: single блок «Результат». Courses / дейлики / спидраны: вкладки. */
export type ExecutionVariant = 'sandbox' | 'full'

export type ExecutionGradingMode = 'run' | 'submit'

export interface Props {
  state: ExecutionState
  result: RunResult | null
  errorMessage: string | null
  /**
   * `sandbox` — один блок вывода, stderr рядом (как сейчас в песочнице).
   * `full` — Вывод / Тесты / Ошибки (`full` для курсов, дейликов, спидранов).
   */
  variant?: ExecutionVariant
  /**
   * Как трактовать вердикт при `variant="full"` (последняя отправка —
   * «Запустить» vs «Проверить» / сдача задачи).
   */
  gradingMode?: ExecutionGradingMode
}

type PanelTab = 'output' | 'tests' | 'errors'

export default function ExecutionPanel({
  state,
  result,
  errorMessage,
  variant = 'full',
  gradingMode = 'submit'
}: Props) {
  if (variant === 'sandbox') {
    return <RunOnlyPanel state={state} result={result} errorMessage={errorMessage} />
  }
  return (
    <SubmitPanel
      state={state}
      result={result}
      errorMessage={errorMessage}
      gradingMode={gradingMode}
    />
  )
}

function RunOnlyPanel({
  state,
  result,
  errorMessage
}: {
  state: ExecutionState
  result: RunResult | null
  errorMessage: string | null
}) {
  return (
    <section className={styles.panel}>
      <header className={styles.panel__head}>
        <h3 className={styles.panel__title}>Результат</h3>
        {state === 'running' ? (
          <span className={styles.verdict}>
            <FontAwesomeIcon icon={faSpinner} spin /> запуск
          </span>
        ) : null}
      </header>
      <div className={styles.tabs__panel}>
        {state === 'running' ? (
          <Loading />
        ) : errorMessage ? (
          <pre className={styles.errors}>{errorMessage}</pre>
        ) : result ? (
          <RunOutput result={result} />
        ) : (
          <Empty hint="Запусти код, чтобы увидеть вывод." />
        )}
      </div>
    </section>
  )
}

function RunOutput({ result }: { result: RunResult }) {
  const stdout = result.stdout?.trim() ?? ''
  const stderr = result.stderr?.trim() ?? ''
  if (!stdout && !stderr) {
    return <Empty hint="Программа отработала без вывода." />
  }
  return (
    <>
      {stdout ? <pre className={styles.output}>{stdout}</pre> : null}
      {stderr ? <pre className={styles.errors}>{stderr}</pre> : null}
      <span className={styles.output__time}>{result.runtimeMs} мс</span>
    </>
  )
}

function SubmitPanel({
  state,
  result,
  errorMessage,
  gradingMode
}: {
  state: ExecutionState
  result: RunResult | null
  errorMessage: string | null
  gradingMode: ExecutionGradingMode
}) {
  const [panelTab, setPanelTab] = useState<PanelTab>('output')

  useEffect(() => {
    if (state === 'running') {
      setPanelTab('output')
    }
  }, [state])

  useEffect(() => {
    if (state !== 'done') return

    const infraErr = Boolean(errorMessage?.trim())
    const progErr = Boolean(result?.stderr?.trim())
    const hasAnyErr = infraErr || progErr

    const testsFailedSubmit =
      gradingMode === 'submit' &&
      result &&
      (result.testResults?.length ?? 0) > 0 &&
      result.passed === false &&
      !hasAnyErr

    if (hasAnyErr) setPanelTab('errors')
    else if (testsFailedSubmit) setPanelTab('tests')
    else setPanelTab('output')
  }, [state, errorMessage, result, gradingMode])

  const infraFlag = Boolean(errorMessage?.trim())
  const progErrFlag = Boolean(result?.stderr?.trim())

  return (
    <section className={styles.panel}>
      <header className={styles.panel__head}>
        <h3 className={styles.panel__title}>Результаты</h3>
        <Verdict
          state={state}
          result={result}
          gradingMode={gradingMode}
          infraError={infraFlag}
          progStderr={progErrFlag}
        />
      </header>

      <Tabs
        value={panelTab}
        onChange={v => setPanelTab((v ?? 'output') as PanelTab)}
        keepMounted={false}
        classNames={{ list: styles.tabs__list, tab: styles.tabs__tab, panel: styles.tabs__panel }}
      >
        <Tabs.List>
          <Tabs.Tab value="output">Вывод</Tabs.Tab>
          <Tabs.Tab value="tests">Тесты</Tabs.Tab>
          <Tabs.Tab value="errors">Ошибки</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="output">
          {state === 'running' ? (
            <Loading />
          ) : result?.stdout?.trim() ? (
            <pre className={styles.output}>{result.stdout}</pre>
          ) : (
            <Empty hint="Пока пустой вывод. Проверь вкладку «Ошибки» при сбое." />
          )}
          {result ? <span className={styles.output__time}>{result.runtimeMs} мс</span> : null}
        </Tabs.Panel>

        <Tabs.Panel value="tests">
          {state === 'running' ? (
            <Loading />
          ) : !result ? (
            <Empty hint="Тесты появятся после проверки кода или сдачи." />
          ) : (
            <TestResultsList testResults={result.testResults} />
          )}
        </Tabs.Panel>

        <Tabs.Panel value="errors">
          {infraFlag ? (
            <pre className={styles.errors}>{errorMessage}</pre>
          ) : progErrFlag && result?.stderr ? (
            <pre className={styles.errors}>{result.stderr}</pre>
          ) : (
            <Empty hint="Ошибок нет." />
          )}
        </Tabs.Panel>
      </Tabs>
    </section>
  )
}

function Verdict({
  state,
  result,
  gradingMode,
  infraError,
  progStderr
}: {
  state: ExecutionState
  result: RunResult | null
  gradingMode: ExecutionGradingMode
  infraError: boolean
  progStderr: boolean
}) {
  if (state === 'running') {
    return (
      <span className={styles.verdict}>
        <FontAwesomeIcon icon={faSpinner} spin /> запуск
      </span>
    )
  }
  const fatal = infraError || progStderr

  if (fatal) {
    return (
      <span className={`${styles.verdict} ${styles.verdict_failed}`}>
        <FontAwesomeIcon icon={faCircleXmark} /> ошибка
      </span>
    )
  }
  if (!result) {
    return <span className={styles.verdict}>—</span>
  }
  if (gradingMode === 'run') {
    return (
      <span className={`${styles.verdict} ${styles.verdict_passed}`}>
        <FontAwesomeIcon icon={faCircleCheck} /> готово
      </span>
    )
  }
  return result.passed ? (
    <span className={`${styles.verdict} ${styles.verdict_passed}`}>
      <FontAwesomeIcon icon={faCircleCheck} /> тесты пройдены
    </span>
  ) : (
    <span className={`${styles.verdict} ${styles.verdict_failed}`}>
      <FontAwesomeIcon icon={faCircleXmark} /> часть тестов провалена
    </span>
  )
}

function Loading() {
  return (
    <div className={styles.empty}>
      <FontAwesomeIcon icon={faSpinner} spin /> запускаем…
    </div>
  )
}

function Empty({ hint }: { hint: string }) {
  return <div className={styles.empty}>{hint}</div>
}
