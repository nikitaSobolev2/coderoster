import type { CourseSummary } from '~/server/repositories/types'
import CourseCard from '../CourseCard'
import styles from './styles.module.scss'

export interface Props {
  courses: CourseSummary[]
  loading?: boolean
}

export default function CoursesGrid({ courses, loading = false }: Props) {
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
