'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import debounce from 'lodash.debounce'
import { Spotlight } from '@mantine/spotlight'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBolt,
  faBookOpen,
  faCompass,
  faFileLines,
  faGraduationCap,
  faMagnifyingGlass,
  faUser
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { api } from '~/trpc/react'
import type { SearchHit, SearchHitKind } from '~/server/repositories/types'
import styles from './styles.module.scss'

const HIT_ICONS: Record<SearchHitKind, IconDefinition> = {
  course: faGraduationCap,
  user: faUser,
  lesson: faBookOpen,
  page: faFileLines,
  app: faCompass
}

const FALLBACK_ICON: IconDefinition = faBolt

interface Group {
  title: string
  items: SearchHit[]
}

/**
 * Global search overlay — wired to `search.global` and shared between the
 * marketing home page and the platform shell so guests and signed-in users
 * see the same surface. `searchProcedure` is public; sensitive routes
 * (sandbox, settings, etc.) are filtered server-side based on auth state.
 */
export default function SearchSpotlight() {
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

  const groups: Group[] = data
    ? [
        { title: 'Курсы', items: data.courses },
        { title: 'Контент', items: data.pages },
        { title: 'Страницы', items: data.appPages },
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
        placeholder="Поиск курсов, страниц, людей…"
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
                    <FontAwesomeIcon icon={HIT_ICONS[hit.kind] ?? FALLBACK_ICON} />
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
