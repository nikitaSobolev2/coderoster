'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons'
import type { TestResult } from '~/server/repositories/types'
import styles from './styles.module.scss'

export interface TestResultsListProps {
  testResults: TestResult[]
}

/**
 * Renders one row per autotest: human-readable name, pass/fail, stdin (if
 * any), expected vs actual when not hidden, plus worker message.
 */
export default function TestResultsList({ testResults }: TestResultsListProps) {
  if (testResults.length === 0) {
    return <p className={styles.empty}>Нет тестов в ответе.</p>
  }

  return (
    <ul className={styles.list}>
      {testResults.map((test, index) => (
        <li
          key={`${test.name}-${index}`}
          className={`${styles.row} ${test.passed ? styles.row_ok : styles.row_fail}`}
        >
          <div className={styles.row__head}>
            <span className={styles.row__order}>Тест {index + 1}</span>
            <FontAwesomeIcon
              icon={test.passed ? faCircleCheck : faCircleXmark}
              className={styles.row__icon}
              aria-hidden
            />
            <span className={styles.row__name}>{test.name}</span>
            <span className={styles.row__verdict} data-passed={test.passed}>
              {test.passed ? 'Пройден' : 'Не пройден'}
            </span>
          </div>
          {test.input != null && test.input !== '' ? (
            <div className={styles.row__block}>
              <span className={styles.k}>Вход (stdin)</span>
              <pre className={styles.v}>{test.input}</pre>
            </div>
          ) : null}
          {test.hidden ? (
            <p className={styles.row__hint}>
              Этот тест отмечен как скрытый: ожидаемый вывод не показывается. Результат:{' '}
              {test.passed ? 'совпал с эталоном' : 'не совпал'}.
            </p>
          ) : (
            <div className={styles.pairs}>
              <div className={styles.row__block}>
                <span className={styles.k}>Ожидаемый вывод (stdout)</span>
                <pre className={styles.v}>{test.expected ?? '—'}</pre>
              </div>
              <div className={styles.row__block}>
                <span className={styles.k}>Фактический вывод</span>
                <pre className={styles.v}>{test.actual ?? '—'}</pre>
              </div>
            </div>
          )}
          {test.message ? (
            <div className={styles.row__block}>
              <span className={styles.k}>Детали</span>
              <pre className={styles.v_message}>{test.message}</pre>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
