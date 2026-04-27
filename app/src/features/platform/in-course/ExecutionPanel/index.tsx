'use client'

import { Tabs } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faCircleXmark, faSpinner } from '@fortawesome/free-solid-svg-icons'
import type { RunResult } from '~/server/repositories/types'
import styles from './styles.module.scss'

export type ExecutionState = 'idle' | 'running' | 'done'
export type ExecutionPanelMode = 'run' | 'submit'

export interface Props {
  state: ExecutionState
  result: RunResult | null
  errorMessage: string | null
  /**
   * `run`    — playground / preview view: single Output tab, no verdict, no
   *            tests panel. Stderr is folded into the output.
   * `submit` — graded view: Output / Tests / Errors tabs + pass/fail verdict.
   */
  mode?: ExecutionPanelMode
}

export default function ExecutionPanel({ state, result, errorMessage, mode = 'submit' }: Props) {
  if (mode === 'run') {
    return <RunOnlyPanel state={state} result={result} errorMessage={errorMessage} />
  }
  return <SubmitPanel state={state} result={result} errorMessage={errorMessage} />
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
  errorMessage
}: {
  state: ExecutionState
  result: RunResult | null
  errorMessage: string | null
}) {
  return (
    <section className={styles.panel}>
      <header className={styles.panel__head}>
        <h3 className={styles.panel__title}>Результаты</h3>
        <Verdict state={state} result={result} hasError={Boolean(errorMessage)} />
      </header>

      <Tabs
        defaultValue="output"
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
          ) : result?.stdout ? (
            <pre className={styles.output}>{result.stdout}</pre>
          ) : (
            <Empty hint="Запусти код, чтобы увидеть вывод." />
          )}
          {result ? <span className={styles.output__time}>{result.runtimeMs} мс</span> : null}
        </Tabs.Panel>

        <Tabs.Panel value="tests">
          {state === 'running' ? (
            <Loading />
          ) : !result ? (
            <Empty hint="Тесты прогонятся при первом запуске." />
          ) : (
            <ul className={styles.tests}>
              {result.testResults.map(test => (
                <li
                  key={test.name}
                  className={`${styles.test} ${test.passed ? styles.test_passed : styles.test_failed}`}
                >
                  <FontAwesomeIcon
                    icon={test.passed ? faCircleCheck : faCircleXmark}
                    className={styles.test__icon}
                  />
                  <div className={styles.test__body}>
                    <span className={styles.test__title}>{test.name}</span>
                    {test.message ? (
                      <span className={styles.test__message}>{test.message}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="errors">
          {errorMessage ? (
            <pre className={styles.errors}>{errorMessage}</pre>
          ) : result?.stderr ? (
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
  hasError
}: {
  state: ExecutionState
  result: RunResult | null
  hasError: boolean
}) {
  if (state === 'running') {
    return (
      <span className={styles.verdict}>
        <FontAwesomeIcon icon={faSpinner} spin /> запуск
      </span>
    )
  }
  if (hasError) {
    return (
      <span className={`${styles.verdict} ${styles.verdict_failed}`}>
        <FontAwesomeIcon icon={faCircleXmark} /> ошибка
      </span>
    )
  }
  if (!result) {
    return <span className={styles.verdict}>—</span>
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
