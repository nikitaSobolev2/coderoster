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

export default function CoursesList() {
  const [filters, setFilters] = useState<CoursesQuery>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<CoursesQuery>(DEFAULT_FILTERS)

  const apply = useMemo(() => debounce((next: CoursesQuery) => setAppliedFilters(next), 250), [])

  useEffect(() => () => apply.cancel(), [apply])

  const onChange = (next: CoursesQuery) => {
    setFilters(next)
    apply(next)
  }

  const { data, isLoading, isFetching } = api.course.list.useQuery(appliedFilters, {
    placeholderData: keepPreviousData
  })

  const courses = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className={styles.list}>
      <CourseFilters filters={filters} onChange={onChange} total={total} />
      <CoursesGrid courses={courses} loading={isLoading || isFetching} />
    </div>
  )
}
