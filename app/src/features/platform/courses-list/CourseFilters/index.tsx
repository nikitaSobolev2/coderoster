'use client'

import { ActionIcon, Chip, Select, Text, TextInput } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons'
import type { CoursesQuery, Difficulty, Language } from '~/server/repositories/types'
import styles from './styles.module.scss'

const FILTER_ALL = 'all' as const

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'php', label: 'PHP' }
]

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'beginner', label: 'Новичок' },
  { value: 'intermediate', label: 'Средний' },
  { value: 'advanced', label: 'Продвинутый' }
]

const SORT_OPTIONS = [
  { value: 'popular', label: 'По популярности' },
  { value: 'newest', label: 'Сначала новые' },
  { value: 'shortest', label: 'Самые короткие' }
]

export interface Props {
  filters: CoursesQuery
  onChange: (next: CoursesQuery) => void
  total: number
}

function normaliseChipValue(raw: string | string[] | null | undefined): string {
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw)) return raw[0] ?? ''
  return ''
}

export default function CourseFilters({ filters, onChange, total }: Readonly<Props>) {
  function update(patch: Partial<CoursesQuery>) {
    onChange({ ...filters, ...patch })
  }

  const queryValue = filters.q ?? ''
  const languageValue = filters.language ?? FILTER_ALL
  const difficultyValue = filters.difficulty ?? FILTER_ALL

  const onChipChange = <T extends string>(
    raw: string | string[] | null,
    key: keyof CoursesQuery
  ) => {
    const next = normaliseChipValue(raw)
    const resolved = next === FILTER_ALL || next === '' ? undefined : (next as T)
    update({ [key]: resolved } as Partial<CoursesQuery>)
  }

  return (
    <div className={styles.filters}>
      <div className={styles.filters__row}>
        <TextInput
          value={queryValue}
          onChange={event => update({ q: event.currentTarget.value })}
          leftSection={<FontAwesomeIcon icon={faMagnifyingGlass} />}
          rightSection={
            queryValue ? (
              <ActionIcon
                variant="subtle"
                aria-label="Очистить поиск"
                onClick={() => update({ q: undefined })}
              >
                <FontAwesomeIcon icon={faXmark} />
              </ActionIcon>
            ) : null
          }
          placeholder="Поиск по названию или тегам"
          classNames={{ input: styles.filters__searchInput }}
          className={styles.filters__search}
        />
        <Select
          data={SORT_OPTIONS}
          value={filters.sort ?? 'popular'}
          onChange={value => update({ sort: (value ?? 'popular') as CoursesQuery['sort'] })}
          allowDeselect={false}
          className={styles.filters__sort}
        />
      </div>

      <div className={styles.filters__row}>
        <Text size="sm" c="dimmed" className={styles.filters__chipLabel}>
          Язык
        </Text>
        <Chip.Group
          multiple={false}
          value={languageValue}
          onChange={value => onChipChange<Language>(value, 'language')}
        >
          <Chip value={FILTER_ALL}>Все</Chip>
          {LANGUAGES.map(option => (
            <Chip key={option.value} value={option.value}>
              {option.label}
            </Chip>
          ))}
        </Chip.Group>
      </div>

      <div className={styles.filters__row}>
        <Text size="sm" c="dimmed" className={styles.filters__chipLabel}>
          Уровень
        </Text>
        <Chip.Group
          multiple={false}
          value={difficultyValue}
          onChange={value => onChipChange<Difficulty>(value, 'difficulty')}
        >
          <Chip value={FILTER_ALL}>Все</Chip>
          {DIFFICULTIES.map(option => (
            <Chip key={option.value} value={option.value}>
              {option.label}
            </Chip>
          ))}
        </Chip.Group>
      </div>

      <div className={styles.filters__meta}>
        Найдено: <strong>{total}</strong>
      </div>
    </div>
  )
}
