'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Avatar, SegmentedControl, Skeleton } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRankingStar } from '@fortawesome/free-solid-svg-icons'
import EmptyState from '~/shared/components/ui/EmptyState'
import { api } from '~/trpc/react'
import type { LeaderboardEntry } from '~/server/services/LeaderboardService'
import styles from './styles.module.scss'

type LeaderboardWindow = 'week' | 'month' | 'allTime'
type LeaderboardLanguage = 'all' | 'python' | 'php'

const WINDOW_OPTIONS: { value: LeaderboardWindow; label: string }[] = [
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'allTime', label: 'Всё время' }
]

const LANGUAGE_OPTIONS: { value: LeaderboardLanguage; label: string }[] = [
  { value: 'all', label: 'Любой язык' },
  { value: 'python', label: 'Python' },
  { value: 'php', label: 'PHP' }
]

export interface Props {
  initial: LeaderboardEntry[]
}

export default function LeaderboardTable({ initial }: Props) {
  const [windowValue, setWindow] = useState<LeaderboardWindow>('allTime')
  const [language, setLanguage] = useState<LeaderboardLanguage>('all')
  const query = api.leaderboard.global.useQuery(
    { window: windowValue, language, limit: 50 },
    {
      initialData: windowValue === 'allTime' && language === 'all' ? initial : undefined,
      refetchOnWindowFocus: false
    }
  )

  const entries = query.data ?? []
  const isLoading = query.isPending && entries.length === 0

  return (
    <div className={styles.table}>
      <div className={styles.table__filters}>
        <SegmentedControl
          value={windowValue}
          onChange={value => setWindow(value as LeaderboardWindow)}
          data={WINDOW_OPTIONS}
          size="xs"
        />
        <SegmentedControl
          value={language}
          onChange={value => setLanguage(value as LeaderboardLanguage)}
          data={LANGUAGE_OPTIONS}
          size="xs"
        />
      </div>

      {isLoading ? (
        <div className={styles.table__skeletons}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} height={56} radius="md" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          title="Пока пусто"
          hint="В этом окне ещё нет решений. Загляни позже или попробуй сдать дейлик."
          icon={faRankingStar}
        />
      ) : (
        <ul className={styles.table__list}>
          {entries.map(entry => (
            <li key={entry.userId} className={styles.row} data-rank={entry.rank}>
              <span className={styles.row__rank}>{entry.rank}</span>
              <Avatar
                src={entry.avatarUrl ?? undefined}
                alt={entry.displayName}
                radius="xl"
                size={36}
              >
                {initials(entry.displayName)}
              </Avatar>
              <div className={styles.row__body}>
                <Link href={`/u/${entry.username}`} className={styles.row__name}>
                  {entry.displayName}
                </Link>
                <span className={styles.row__handle}>@{entry.username}</span>
              </div>
              <div className={styles.row__stats}>
                <span className={styles.row__xp}>{entry.xp.toLocaleString('ru-RU')} XP</span>
                <span className={styles.row__tasks}>{entry.tasksSolved} задач</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function initials(displayName: string): string {
  return displayName
    .split(' ')
    .map(word => word[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}
