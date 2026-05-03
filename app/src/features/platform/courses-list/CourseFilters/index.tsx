'use client'

import { useState } from 'react'
import { Group, Stack, Text } from '@mantine/core'
import type { CategoryRef, CoursesQuery } from '~/server/repositories/types'
import type { CoursesGridDensity } from '../coursesGridDensity'
import CourseFiltersDrawer from './CourseFiltersDrawer'
import CourseFiltersToolbar from './CourseFiltersToolbar'
import { catalogFiltersDirty } from './courseFiltersConfig'
import styles from './styles.module.scss'

export interface Props {
  filters: CoursesQuery
  onChange: (next: CoursesQuery) => void
  total: number
  categories: CategoryRef[]
  defaults: CoursesQuery
  gridDensity: CoursesGridDensity
  onGridDensityChange: (next: CoursesGridDensity) => void
}

export default function CourseFilters({
  filters,
  onChange,
  total,
  categories,
  defaults,
  gridDensity,
  onGridDensityChange
}: Readonly<Props>) {
  const [drawerOpened, setDrawerOpened] = useState(false)
  const canResetFilters = catalogFiltersDirty(filters, defaults)

  return (
    <Stack className={styles.filters} gap="sm">
      <CourseFiltersToolbar
        filters={filters}
        onChange={onChange}
        defaults={defaults}
        gridDensity={gridDensity}
        onGridDensityChange={onGridDensityChange}
        onOpenDrawer={() => setDrawerOpened(true)}
      />
      <Group
        justify="space-between"
        align="center"
        gap="sm"
        wrap="wrap"
        className={styles.filters__metaRow}
      >
        <Text size="xs" c="dimmed" className={styles.filters__meta}>
          Найдено: <strong>{total}</strong>
        </Text>
        <button
          type="button"
          className={styles.filters__reset}
          disabled={!canResetFilters}
          onClick={() => onChange({ ...defaults })}
        >
          Сбросить фильтры
        </button>
      </Group>
      <CourseFiltersDrawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        filters={filters}
        onChange={onChange}
        categories={categories}
        defaults={defaults}
        total={total}
      />
    </Stack>
  )
}
