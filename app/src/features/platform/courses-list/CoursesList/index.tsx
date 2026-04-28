'use client'

import { useEffect, useMemo, useState } from 'react'
import debounce from 'lodash.debounce'
import { keepPreviousData } from '@tanstack/react-query'
import { api } from '~/trpc/react'
import type { CoursesQuery } from '~/server/repositories/types'
import CourseFilters from '../CourseFilters'
import CoursesGrid from '../CoursesGrid'
import styles from './styles.module.scss'

const DEFAULT_FILTERS: CoursesQuery = { sort: 'popular' }
const FILTER_APPLY_DEBOUNCE_MS = 250

export interface Props {
  initialFilters?: CoursesQuery
}

export default function CoursesList({ initialFilters }: Props = {}) {
  const baseline = initialFilters ?? DEFAULT_FILTERS
  const [filters, setFilters] = useState<CoursesQuery>(baseline)
  const [appliedFilters, setAppliedFilters] = useState<CoursesQuery>(baseline)

  const apply = useMemo(
    () => debounce((next: CoursesQuery) => setAppliedFilters(next), FILTER_APPLY_DEBOUNCE_MS),
    []
  )

  useEffect(() => () => apply.cancel(), [apply])

  const onChange = (next: CoursesQuery) => {
    setFilters(next)
    apply(next)
  }

  const { data, isLoading, isFetching } = api.course.list.useQuery(appliedFilters, {
    placeholderData: keepPreviousData
  })
  const categoriesQuery = api.course.listCategories.useQuery()

  const courses = data?.items ?? []
  const total = data?.total ?? 0
  const categories = categoriesQuery.data ?? []

  return (
    <div className={styles.list}>
      <CourseFilters
        filters={filters}
        onChange={onChange}
        total={total}
        categories={categories}
        defaults={DEFAULT_FILTERS}
      />
      <CoursesGrid courses={courses} loading={isLoading || isFetching} />
    </div>
  )
}
