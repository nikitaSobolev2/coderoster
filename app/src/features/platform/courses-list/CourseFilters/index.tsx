'use client'

import { ActionIcon, Badge, Group, RangeSlider, Select, Stack, TextInput } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faRotateLeft, faXmark } from '@fortawesome/free-solid-svg-icons'
import type { CategoryRef, CoursesQuery, Difficulty, Language } from '~/server/repositories/types'
import styles from './styles.module.scss'

const FILTER_ALL = 'all' as const

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'php', label: 'PHP' }
]

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'beginner', label: 'Новичок' },
  { value: 'intermediate', label: 'Средний' },
  { value: 'advanced', label: 'Продвинутый' }
]

const SORT_OPTIONS: { value: NonNullable<CoursesQuery['sort']>; label: string }[] = [
  { value: 'popular', label: 'По популярности' },
  { value: 'newest', label: 'Сначала новые' },
  { value: 'shortest', label: 'Самые короткие' }
]

const DURATION_BOUNDS: [number, number] = [0, 50]

export interface Props {
  filters: CoursesQuery
  onChange: (next: CoursesQuery) => void
  total: number
  categories: CategoryRef[]
  defaults: CoursesQuery
}

export default function CourseFilters({
  filters,
  onChange,
  total,
  categories,
  defaults
}: Readonly<Props>) {
  const update = (patch: Partial<CoursesQuery>) => onChange({ ...filters, ...patch })
  const clearKey = <K extends keyof CoursesQuery>(key: K) =>
    onChange({ ...filters, [key]: undefined })

  const queryValue = filters.q ?? ''
  const language = filters.language ?? FILTER_ALL
  const difficulty = filters.difficulty ?? FILTER_ALL
  const categorySlug = filters.categorySlug ?? FILTER_ALL
  const durationRange: [number, number] = [
    filters.durationMin ?? DURATION_BOUNDS[0],
    filters.durationMax ?? DURATION_BOUNDS[1]
  ]

  const categoryOptions = [
    { value: FILTER_ALL, label: 'Все категории' },
    ...categories.map(category => ({ value: category.slug, label: category.title }))
  ]

  const activeFilterChips = collectActiveChips({
    filters,
    categories,
    durationBounds: DURATION_BOUNDS,
    onClear: clearKey
  })

  return (
    <Stack className={styles.filters} gap="md">
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
                onClick={() => clearKey('q')}
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
          value={filters.sort ?? defaults.sort ?? 'popular'}
          onChange={value =>
            update({ sort: (value ?? defaults.sort ?? 'popular') as CoursesQuery['sort'] })
          }
          allowDeselect={false}
          className={styles.filters__sort}
          aria-label="Сортировка"
        />
      </div>

      <div className={styles.filters__grid}>
        <Select
          label="Категория"
          data={categoryOptions}
          value={categorySlug}
          allowDeselect={false}
          searchable={categories.length > 6}
          onChange={value =>
            update({ categorySlug: !value || value === FILTER_ALL ? undefined : value })
          }
        />
        <Select
          label="Язык"
          data={[{ value: FILTER_ALL, label: 'Любой' }, ...LANGUAGE_OPTIONS]}
          value={language}
          allowDeselect={false}
          onChange={value =>
            update({
              language: !value || value === FILTER_ALL ? undefined : (value as Language)
            })
          }
        />
        <Select
          label="Уровень"
          data={[{ value: FILTER_ALL, label: 'Любой' }, ...DIFFICULTY_OPTIONS]}
          value={difficulty}
          allowDeselect={false}
          onChange={value =>
            update({
              difficulty: !value || value === FILTER_ALL ? undefined : (value as Difficulty)
            })
          }
        />
        <div className={styles.filters__duration}>
          <span className={styles.filters__durationLabel}>
            Длительность: {durationRange[0]}—{durationRange[1]} ч
          </span>
          <RangeSlider
            min={DURATION_BOUNDS[0]}
            max={DURATION_BOUNDS[1]}
            step={1}
            minRange={1}
            value={durationRange}
            onChange={([min, max]) =>
              update({
                durationMin: min === DURATION_BOUNDS[0] ? undefined : min,
                durationMax: max === DURATION_BOUNDS[1] ? undefined : max
              })
            }
            marks={[
              { value: 0, label: '0' },
              { value: 25, label: '25' },
              { value: 50, label: '50' }
            ]}
          />
        </div>
      </div>

      <div className={styles.filters__activeRow}>
        <span className={styles.filters__meta}>
          Найдено: <strong>{total}</strong>
        </span>
        {activeFilterChips.length > 0 ? (
          <Group gap="xs" wrap="wrap">
            {activeFilterChips.map(chip => (
              <Badge
                key={chip.id}
                variant="light"
                color="indigo"
                rightSection={
                  <ActionIcon
                    component="span"
                    role="button"
                    size="xs"
                    variant="transparent"
                    aria-label={`Сбросить ${chip.label}`}
                    onClick={chip.onClear}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </ActionIcon>
                }
              >
                {chip.label}
              </Badge>
            ))}
            <ActionIcon
              variant="subtle"
              aria-label="Сбросить все фильтры"
              onClick={() => onChange({ ...defaults })}
            >
              <FontAwesomeIcon icon={faRotateLeft} />
            </ActionIcon>
          </Group>
        ) : null}
      </div>
    </Stack>
  )
}

interface ActiveChip {
  id: string
  label: string
  onClear: () => void
}

function collectActiveChips(input: {
  filters: CoursesQuery
  categories: CategoryRef[]
  durationBounds: [number, number]
  onClear: <K extends keyof CoursesQuery>(key: K) => void
}): ActiveChip[] {
  const { filters, categories, durationBounds, onClear } = input
  const chips: ActiveChip[] = []
  if (filters.q) chips.push({ id: 'q', label: `«${filters.q}»`, onClear: () => onClear('q') })
  if (filters.language) {
    chips.push({
      id: 'language',
      label:
        LANGUAGE_OPTIONS.find(option => option.value === filters.language)?.label ??
        filters.language,
      onClear: () => onClear('language')
    })
  }
  if (filters.difficulty) {
    chips.push({
      id: 'difficulty',
      label:
        DIFFICULTY_OPTIONS.find(option => option.value === filters.difficulty)?.label ??
        filters.difficulty,
      onClear: () => onClear('difficulty')
    })
  }
  if (filters.categorySlug) {
    const found = categories.find(category => category.slug === filters.categorySlug)
    chips.push({
      id: 'category',
      label: found?.title ?? filters.categorySlug,
      onClear: () => onClear('categorySlug')
    })
  }
  if (filters.durationMin !== undefined || filters.durationMax !== undefined) {
    const min = filters.durationMin ?? durationBounds[0]
    const max = filters.durationMax ?? durationBounds[1]
    chips.push({
      id: 'duration',
      label: `${min}—${max} ч`,
      onClear: () => {
        onClear('durationMin')
        onClear('durationMax')
      }
    })
  }
  return chips
}
