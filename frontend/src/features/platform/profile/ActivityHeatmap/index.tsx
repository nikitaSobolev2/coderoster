'use client'

import { useMemo, useState } from 'react'
import { Tooltip } from '@mantine/core'
import type { ActivityCell } from '~/server/repositories/types'
import styles from './styles.module.scss'

export interface Props {
  username: string
  initialCells: ActivityCell[]
  initialYear: number
}

const WEEKDAYS = ['Пн', 'Ср', 'Пт']
const MONTH_LABELS = [
  'Янв',
  'Фев',
  'Мар',
  'Апр',
  'Май',
  'Июн',
  'Июл',
  'Авг',
  'Сен',
  'Окт',
  'Ноя',
  'Дек'
]

/**
 * GitHub-style year heatmap rendered from `profile.getActivity` cells.
 * Pure presentation — switching the year is a future enhancement; for now
 * we render whatever the server prefetched.
 */
export default function ActivityHeatmap({ username, initialCells, initialYear }: Props) {
  const [year] = useState(initialYear)
  const total = useMemo(
    () => initialCells.reduce((sum, cell) => sum + cell.count, 0),
    [initialCells]
  )
  const weeks = useMemo(() => groupByWeek(initialCells), [initialCells])

  return (
    <section className={styles.heatmap} aria-label={`Активность ${username} за ${year}`}>
      <header className={styles.heatmap__head}>
        <h3 className={styles.heatmap__title}>Активность</h3>
        <span className={styles.heatmap__total}>
          {total} событий · {year}
        </span>
      </header>

      <div className={styles.heatmap__grid}>
        <div className={styles.heatmap__weekdays}>
          {WEEKDAYS.map(day => (
            <span key={day} className={styles.heatmap__weekday}>
              {day}
            </span>
          ))}
        </div>
        <div className={styles.heatmap__weeks}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className={styles.week}>
              {week.map((cell, dayIndex) =>
                cell ? (
                  <Tooltip
                    key={cell.date}
                    label={`${cell.date}: ${cell.count} ${cell.count === 1 ? 'событие' : 'событий'}`}
                    withArrow
                    openDelay={150}
                  >
                    <span
                      className={styles.cell}
                      data-level={cell.level}
                      role="gridcell"
                      aria-label={`${cell.date}: ${cell.count}`}
                    />
                  </Tooltip>
                ) : (
                  <span key={`empty-${weekIndex}-${dayIndex}`} className={styles.cell_empty} />
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <Legend />
      <div className={styles.heatmap__months} aria-hidden="true">
        {MONTH_LABELS.map(label => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </section>
  )
}

function Legend() {
  return (
    <div className={styles.legend} aria-hidden="true">
      <span className={styles.legend__label}>Меньше</span>
      {[0, 1, 2, 3, 4].map(level => (
        <span key={level} className={styles.cell} data-level={level} />
      ))}
      <span className={styles.legend__label}>Больше</span>
    </div>
  )
}

function groupByWeek(cells: ActivityCell[]): (ActivityCell | null)[][] {
  if (cells.length === 0) return []
  const firstDate = new Date(cells[0]!.date)
  const startWeekday = (firstDate.getUTCDay() + 6) % 7
  const padded: (ActivityCell | null)[] = [...Array<null>(startWeekday).fill(null), ...cells]
  const weeks: (ActivityCell | null)[][] = []
  for (let index = 0; index < padded.length; index += 7) {
    weeks.push(padded.slice(index, index + 7))
  }
  return weeks
}
