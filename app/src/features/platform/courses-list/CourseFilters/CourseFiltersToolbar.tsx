'use client'

import {
  ActionIcon,
  Button,
  Group,
  Indicator,
  SegmentedControl,
  Select,
  TextInput,
  type SelectProps
} from '@mantine/core'
import {
  GRID_DENSITY_LABEL,
  nextCoursesGridDensity,
  type CoursesGridDensity
} from '../coursesGridDensity'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowTrendUp,
  faBars,
  faCalendarPlus,
  faFilter,
  faHourglassHalf,
  faMagnifyingGlass,
  faSliders,
  faTableCells,
  faTableCellsLarge,
  faXmark
} from '@fortawesome/free-solid-svg-icons'
import type { CoursesQuery } from '~/server/repositories/types'
import { activeCatalogFilterBadgeCount, SORT_OPTIONS } from './courseFiltersConfig'
import DurationFilterPopover from './DurationFilterPopover'
import LevelFilterPopover from './LevelFilterPopover'
import styles from './CourseFiltersToolbar.module.scss'

const SORT_ICONS = {
  popular: faArrowTrendUp,
  newest: faCalendarPlus,
  shortest: faHourglassHalf
} as const

const GRID_CYCLE_ICONS = {
  list: faBars,
  comfortable: faTableCells,
  compact: faTableCellsLarge
} as const

const renderSortOption: SelectProps['renderOption'] = ({ option }) => (
  <Group gap="sm" wrap="nowrap">
    <FontAwesomeIcon
      icon={SORT_ICONS[option.value as keyof typeof SORT_ICONS]}
      style={{ opacity: 0.85 }}
    />
    <span>{option.label}</span>
  </Group>
)

export interface Props {
  filters: CoursesQuery
  onChange: (next: CoursesQuery) => void
  defaults: CoursesQuery
  gridDensity: CoursesGridDensity
  onGridDensityChange: (next: CoursesGridDensity) => void
  onOpenDrawer: () => void
}

export default function CourseFiltersToolbar({
  filters,
  onChange,
  defaults,
  gridDensity,
  onGridDensityChange,
  onOpenDrawer
}: Readonly<Props>) {
  const update = (patch: Partial<CoursesQuery>) => onChange({ ...filters, ...patch })
  const clearKey = <K extends keyof CoursesQuery>(key: K) =>
    onChange({ ...filters, [key]: undefined })

  const sortValue = filters.sort ?? defaults.sort ?? 'popular'
  const queryValue = filters.q ?? ''
  const filterBadgeCount = activeCatalogFilterBadgeCount(filters)

  return (
    <div className={styles.toolbar}>
      <Indicator
        inline
        color="orange"
        size={20}
        offset={4}
        label={filterBadgeCount}
        disabled={filterBadgeCount === 0}
        className={styles.toolbar__filterIndicator}
      >
        <ActionIcon
          variant="default"
          size="lg"
          radius="xl"
          aria-label="Дополнительные фильтры"
          onClick={onOpenDrawer}
          className={styles.toolbar__filterIconMobile}
        >
          <FontAwesomeIcon icon={faSliders} />
        </ActionIcon>
      </Indicator>

      <Button
        variant="light"
        size="md"
        radius="xl"
        leftSection={<FontAwesomeIcon icon={faFilter} />}
        onClick={onOpenDrawer}
        className={styles.toolbar__advancedDesktop}
      >
        Фильтры
      </Button>

      <Select
        className={styles.toolbar__sort}
        size="md"
        data={SORT_OPTIONS}
        value={sortValue}
        onChange={value =>
          update({ sort: (value ?? defaults.sort ?? 'popular') as CoursesQuery['sort'] })
        }
        allowDeselect={false}
        leftSection={<FontAwesomeIcon icon={SORT_ICONS[sortValue]} />}
        renderOption={renderSortOption}
        comboboxProps={{ middlewares: { shift: { padding: 8 }, flip: { padding: 8 } } }}
        aria-label="Сортировка"
      />

      <ActionIcon
        variant="default"
        size="lg"
        radius="xl"
        aria-label={GRID_DENSITY_LABEL[gridDensity]}
        onClick={() => onGridDensityChange(nextCoursesGridDensity(gridDensity))}
        className={styles.toolbar__gridCycleMobile}
      >
        <FontAwesomeIcon icon={GRID_CYCLE_ICONS[gridDensity]} />
      </ActionIcon>

      <TextInput
        value={queryValue}
        size="md"
        onChange={event => update({ q: event.currentTarget.value })}
        leftSection={<FontAwesomeIcon icon={faMagnifyingGlass} />}
        rightSection={
          queryValue ? (
            <ActionIcon variant="subtle" aria-label="Очистить поиск" onClick={() => clearKey('q')}>
              <FontAwesomeIcon icon={faXmark} />
            </ActionIcon>
          ) : null
        }
        placeholder="Поиск по названию или тегам"
        classNames={{ input: styles.toolbar__searchInput }}
        className={styles.toolbar__search}
      />

      <div className={styles.toolbar__pillRow}>
        <div className={styles.toolbar__durationSlot}>
          <DurationFilterPopover
            filters={filters}
            onApply={(durationMin, durationMax) => update({ durationMin, durationMax })}
            onClear={() => update({ durationMin: undefined, durationMax: undefined })}
          />
        </div>
        <div className={styles.toolbar__levelSlot}>
          <LevelFilterPopover
            filters={filters}
            onApply={difficulties => update({ difficulties })}
            onClear={() => clearKey('difficulties')}
          />
        </div>
      </div>

      <SegmentedControl
        className={styles.toolbar__densityDesktop}
        size="md"
        classNames={{
          root: styles.toolbar__densityRoot,
          control: styles.toolbar__densityControl,
          label: styles.toolbar__densityLabel
        }}
        value={gridDensity}
        onChange={value => onGridDensityChange(value as CoursesGridDensity)}
        data={[
          {
            value: 'list',
            label: (
              <span className={styles.densityIcon} title="Подробный список" aria-hidden>
                <FontAwesomeIcon icon={faBars} />
              </span>
            )
          },
          {
            value: 'comfortable',
            label: (
              <span className={styles.densityIcon} title="Сетка" aria-hidden>
                <FontAwesomeIcon icon={faTableCells} />
              </span>
            )
          },
          {
            value: 'compact',
            label: (
              <span className={styles.densityIcon} title="Компактная сетка" aria-hidden>
                <FontAwesomeIcon icon={faTableCellsLarge} />
              </span>
            )
          }
        ]}
        aria-label="Вид списка курсов"
      />
    </div>
  )
}
