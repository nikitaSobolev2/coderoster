'use client'

import { Chip, Select, TextInput } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import type { CoursesQuery, Difficulty, Language } from '~/server/repositories/types'
import styles from './styles.module.scss'

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

export default function CourseFilters({ filters, onChange, total }: Props) {
  function update(patch: Partial<CoursesQuery>) {
    onChange({ ...filters, ...patch })
  }

  return (
    <div className={styles.filters}>
      <div className={styles.filters__row}>
        <TextInput
          value={filters.q ?? ''}
          onChange={event => update({ q: event.currentTarget.value })}
          leftSection={<FontAwesomeIcon icon={faMagnifyingGlass} />}
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
        <Chip.Group
          multiple={false}
          value={filters.language ?? null}
          onChange={value => update({ language: (value as Language | null) ?? undefined })}
        >
          <Chip value="" disabled>
            Язык
          </Chip>
          {LANGUAGES.map(option => (
            <Chip key={option.value} value={option.value}>
              {option.label}
            </Chip>
          ))}
        </Chip.Group>
      </div>

      <div className={styles.filters__row}>
        <Chip.Group
          multiple={false}
          value={filters.difficulty ?? null}
          onChange={value => update({ difficulty: (value as Difficulty | null) ?? undefined })}
        >
          <Chip value="" disabled>
            Уровень
          </Chip>
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
