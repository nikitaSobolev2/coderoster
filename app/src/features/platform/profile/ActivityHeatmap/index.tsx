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

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
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
 * Sparse API data is expanded to every calendar day in the year (UTC);
 * days without rows use level 0 — base `.cell` tint (darkest in the scale).
 */
export default function ActivityHeatmap({ username, initialCells, initialYear }: Props) {
  const [year] = useState(initialYear)
  const denseCells = useMemo(() => buildDenseYearCells(year, initialCells), [year, initialCells])
  const total = useMemo(() => denseCells.reduce((sum, cell) => sum + cell.count, 0), [denseCells])
  const weeks = useMemo(() => groupByWeek(denseCells), [denseCells])

  return (
    <section className={styles.heatmap} aria-label={`Активность ${username} за ${year}`}>
      <header className={styles.heatmap__head}>
        <h3 className={styles.heatmap__title}>Активность</h3>
        <span className={styles.heatmap__total}>
          {total} событий · {year}
        </span>
      </header>

      <div className={styles.heatmap__chart}>
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
                    label={
                      cell.count === 0
                        ? `${cell.date}: нет событий`
                        : `${cell.date}: ${cell.count} ${cell.count === 1 ? 'событие' : 'событий'}`
                    }
                    withArrow
                    openDelay={150}
                  >
                    <span className={styles.weekCell}>
                      <span
                        className={styles.cell}
                        data-level={cell.level}
                        role="gridcell"
                        aria-label={`${cell.date}: ${cell.count}`}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span key={`empty-${weekIndex}-${dayIndex}`} className={styles.weekCell}>
                    <span className={styles.cell_empty} />
                  </span>
                )
              )}
            </div>
          ))}
        </div>
        <div className={styles.heatmap__months} aria-hidden="true">
          {MONTH_LABELS.map(label => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>

      <Legend />
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

function buildDenseYearCells(year: number, sparse: ActivityCell[]): ActivityCell[] {
  const byDate = new Map(sparse.map(cell => [cell.date, cell]))
  const cells: ActivityCell[] = []
  const cursor = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year, 11, 31))
  while (cursor <= end) {
    const dateStr = cursor.toISOString().slice(0, 10)
    const existing = byDate.get(dateStr)
    cells.push(existing ?? { date: dateStr, count: 0, level: 0 })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return cells
}

function groupByWeek(cells: ActivityCell[]): (ActivityCell | null)[][] {
  if (cells.length === 0) return []
  const firstDate = new Date(`${cells[0]!.date}T00:00:00.000Z`)
  const startWeekday = (firstDate.getUTCDay() + 6) % 7
  const padded: (ActivityCell | null)[] = [...Array<null>(startWeekday).fill(null), ...cells]
  while (padded.length % 7 !== 0) {
    padded.push(null)
  }
  const weeks: (ActivityCell | null)[][] = []
  for (let index = 0; index < padded.length; index += 7) {
    weeks.push(padded.slice(index, index + 7))
  }
  return weeks
}
