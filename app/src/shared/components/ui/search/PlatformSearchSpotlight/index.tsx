'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import debounce from 'lodash.debounce'
import { Spotlight } from '@mantine/spotlight'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpen,
  faGraduationCap,
  faMagnifyingGlass,
  faUser
} from '@fortawesome/free-solid-svg-icons'
import { api } from '~/trpc/react'
import type { SearchHit } from '~/server/repositories/types'
import styles from './styles.module.scss'

const HIT_ICONS = {
  course: faGraduationCap,
  user: faUser,
  lesson: faBookOpen
} as const

/**
 * Global platform search. Bound to `search.global` and shared between every
 * page in the (platform) route group via the spotlight portal.
 */
export default function PlatformSearchSpotlight() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const updateDebounced = useMemo(
    () => debounce((value: string) => setDebouncedQuery(value), 200),
    []
  )

  const onQueryChange = (next: string) => {
    setQuery(next)
    updateDebounced(next)
  }

  const { data } = api.search.global.useQuery(
    { q: debouncedQuery },
    { enabled: debouncedQuery.length > 0, staleTime: 30_000 }
  )

  const groups = data
    ? [
        { title: 'Курсы', items: data.courses },
        { title: 'Профили', items: data.users },
        { title: 'Уроки', items: data.lessons }
      ].filter(group => group.items.length > 0)
    : []

  const handlePick = (hit: SearchHit) => {
    router.push(hit.href)
    setQuery('')
    setDebouncedQuery('')
  }

  return (
    <Spotlight.Root
      query={query}
      onQueryChange={onQueryChange}
      shortcut={['mod + K', 'mod + P', '/']}
      classNames={{
        overlay: styles.spotlight__overlay,
        inner: styles.spotlight__inner,
        content: styles.spotlight__content
      }}
      withinPortal
      scrollable
    >
      <Spotlight.Search
        placeholder="Поиск курсов, уроков, людей…"
        leftSection={<FontAwesomeIcon icon={faMagnifyingGlass} />}
        classNames={{ input: styles.spotlight__input }}
      />
      <Spotlight.ActionsList className={styles.spotlight__list}>
        {groups.length === 0 ? (
          <Spotlight.Empty className={styles.spotlight__empty}>
            {debouncedQuery.length === 0
              ? 'Начните вводить запрос…'
              : 'Ничего не нашли. Попробуйте другой термин.'}
          </Spotlight.Empty>
        ) : (
          groups.map(group => (
            <Spotlight.ActionsGroup key={group.title} label={group.title}>
              {group.items.map(hit => (
                <Spotlight.Action
                  key={`${hit.kind}-${hit.id}`}
                  onClick={() => handlePick(hit)}
                  highlightQuery
                >
                  <span className={styles.hit__icon}>
                    <FontAwesomeIcon icon={HIT_ICONS[hit.kind]} />
                  </span>
                  <span className={styles.hit__body}>
                    <span className={styles.hit__title}>{hit.title}</span>
                    {hit.subtitle ? (
                      <span className={styles.hit__subtitle}>{hit.subtitle}</span>
                    ) : null}
                  </span>
                </Spotlight.Action>
              ))}
            </Spotlight.ActionsGroup>
          ))
        )}
      </Spotlight.ActionsList>
    </Spotlight.Root>
  )
}
