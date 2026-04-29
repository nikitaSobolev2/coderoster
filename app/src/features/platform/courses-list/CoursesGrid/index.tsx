import { Skeleton } from '@mantine/core'
import type { CourseSummary } from '~/server/repositories/types'
import type { CoursesGridDensity } from '../coursesGridDensity'
import CourseCard from '../CourseCard'
import styles from './styles.module.scss'

const SKELETON_COUNT = 6

export interface Props {
  courses: CourseSummary[]
  loading?: boolean
  density: CoursesGridDensity
}

export default function CoursesGrid({ courses, loading = false, density }: Props) {
  const densityClass =
    density === 'list'
      ? styles.grid_list
      : density === 'compact'
        ? styles.grid_compact
        : styles.grid_comfortable

  if (loading && courses.length === 0) {
    return (
      <div className={`${styles.grid} ${densityClass}`} aria-busy="true">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <CourseCardSkeleton key={index} variant={density} />
        ))}
      </div>
    )
  }

  if (!loading && courses.length === 0) {
    return (
      <div className={styles.empty}>Под фильтры ничего не подходит. Сбросьте часть условий.</div>
    )
  }

  const variant = density === 'list' ? 'list' : density === 'compact' ? 'compact' : 'comfortable'

  return (
    <div className={`${styles.grid} ${densityClass} ${loading ? styles.grid_loading : ''}`}>
      {courses.map(course => (
        <CourseCard key={course.id} course={course} variant={variant} />
      ))}
    </div>
  )
}

function CourseCardSkeleton({ variant }: { variant: CoursesGridDensity }) {
  if (variant === 'list') {
    return (
      <div className={styles.skeletonList}>
        <Skeleton height={140} radius="md" className={styles.skeletonList__media} />
        <div className={styles.skeletonList__body}>
          <Skeleton height={22} radius="sm" width="55%" />
          <Skeleton height={14} radius="sm" mt="sm" />
          <Skeleton height={14} radius="sm" mt="xs" width="88%" />
          <Skeleton height={36} radius="sm" mt="md" width="40%" />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.skeleton}>
      <Skeleton height={variant === 'compact' ? 120 : 160} radius="md" />
      <Skeleton height={20} radius="sm" width="60%" mt="md" />
      {variant === 'comfortable' ? (
        <>
          <Skeleton height={28} radius="sm" mt="sm" />
          <Skeleton height={14} radius="sm" mt="sm" />
          <Skeleton height={14} radius="sm" mt="xs" width="80%" />
          <Skeleton height={36} radius="sm" mt="md" />
        </>
      ) : (
        <Skeleton height={32} radius="sm" mt="md" />
      )}
    </div>
  )
}
