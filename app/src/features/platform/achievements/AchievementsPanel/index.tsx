'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Progress, SegmentedControl } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleQuestion, faTrophy } from '@fortawesome/free-solid-svg-icons'
import EmptyState from '~/shared/components/ui/EmptyState'
import { resolveIcon } from '~/shared/components/ui/IconOrImageField/iconMap'
import type { AchievementProgress } from '~/server/api/routers/achievement'
import styles from './styles.module.scss'

export interface Props {
  initial: AchievementProgress[]
  isAuthenticated: boolean
}

type FilterValue = 'all' | 'progression' | 'streak' | 'speed' | 'completionist' | 'hidden'

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'progression', label: 'Прогресс' },
  { value: 'streak', label: 'Стрик' },
  { value: 'speed', label: 'Скорость' },
  { value: 'completionist', label: 'Полнота' },
  { value: 'hidden', label: 'Секреты' }
]

export default function AchievementsPanel({ initial, isAuthenticated }: Props) {
  const [filter, setFilter] = useState<FilterValue>('all')

  const counts = useMemo(() => {
    const earned = initial.filter(item => item.earned).length
    return { earned, total: initial.length }
  }, [initial])

  const visible = useMemo(
    () => initial.filter(item => filter === 'all' || item.category === filter),
    [initial, filter]
  )

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Войди, чтобы видеть прогресс"
        hint="Гостям видны только разблокированные ачивки. После входа покажем всё."
        icon={faTrophy}
      />
    )
  }

  return (
    <div className={styles.panel}>
      <header className={styles.panel__head}>
        <div>
          <h2 className={styles.panel__title}>
            Получено {counts.earned} из {counts.total}
          </h2>
          <p className={styles.panel__copy}>
            Ачивки фиксируют твой прогресс — каждое условие проверяется автоматически.
          </p>
        </div>
        <SegmentedControl
          value={filter}
          onChange={value => setFilter(value as FilterValue)}
          data={FILTERS}
          size="xs"
        />
      </header>

      {visible.length === 0 ? (
        <EmptyState
          title="Пока пусто"
          hint="В этой категории нет ачивок. Попробуй другой фильтр."
          icon={faCircleQuestion}
        />
      ) : (
        <ul className={styles.panel__grid}>
          {visible.map(item => (
            <li key={item.id} className={styles.panel__tile} data-earned={item.earned}>
              <div className={styles.panel__iconWrap} data-rarity={item.rarity}>
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt=""
                    aria-hidden
                    fill
                    sizes="48px"
                    className={styles.panel__iconImage}
                  />
                ) : (
                  <FontAwesomeIcon icon={resolveIcon(item.icon)} />
                )}
              </div>
              <div className={styles.panel__body}>
                <h3 className={styles.panel__tileTitle}>
                  {item.hidden && !item.earned ? '???' : item.name}
                </h3>
                <p className={styles.panel__tileCopy}>
                  {item.hidden && !item.earned ? 'Секретное условие' : item.description}
                </p>
                <Progress
                  value={(item.currentN / Math.max(item.goal, 1)) * 100}
                  size="sm"
                  radius="xl"
                  color={item.earned ? 'green' : 'grape'}
                />
                <span className={styles.panel__progressLabel}>
                  {item.earned ? earnedLabel(item.earnedAt) : `${item.currentN} / ${item.goal}`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function earnedLabel(earnedAt: Date | null): string {
  if (!earnedAt) return 'Получено'
  return `Получено ${new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short'
  }).format(earnedAt)}`
}
