import { Skeleton } from '@mantine/core'
import type { CourseSummary } from '~/server/repositories/types'
import CourseCard from '../CourseCard'
import styles from './styles.module.scss'

const SKELETON_COUNT = 6

export interface Props {
  courses: CourseSummary[]
  loading?: boolean
}

export default function CoursesGrid({ courses, loading = false }: Props) {
  if (loading && courses.length === 0) {
    return (
      <div className={styles.grid} aria-busy="true">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <CourseCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (!loading && courses.length === 0) {
    return (
      <div className={styles.empty}>Под фильтры ничего не подходит. Сбросьте часть условий.</div>
    )
  }

  return (
    <div className={`${styles.grid} ${loading ? styles.grid_loading : ''}`}>
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}

function CourseCardSkeleton() {
  return (
    <div className={styles.skeleton}>
      <Skeleton height={160} radius="md" />
      <Skeleton height={20} radius="sm" width="60%" mt="md" />
      <Skeleton height={28} radius="sm" mt="sm" />
      <Skeleton height={14} radius="sm" mt="sm" />
      <Skeleton height={14} radius="sm" mt="xs" width="80%" />
      <Skeleton height={36} radius="sm" mt="md" />
    </div>
  )
}
