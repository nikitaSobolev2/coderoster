'use client'

import Link from 'next/link'
import { Progress } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle, faCircleCheck, faPlay } from '@fortawesome/free-solid-svg-icons'
import type { CourseDetail } from '~/server/repositories/types'
import styles from './styles.module.scss'

export interface Props {
  course: CourseDetail
  currentLessonId: string
  completedLessonIds: string[]
}

export default function TaskNav({ course, currentLessonId, completedLessonIds }: Props) {
  const completed = new Set(completedLessonIds)
  const flat = course.modules.flatMap(module => module.lessons.map(lesson => ({ module, lesson })))
  const totalLessons = flat.length
  const completedCount = flat.filter(item => completed.has(item.lesson.id)).length
  const progressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100)

  return (
    <aside className={styles.nav}>
      <div className={styles.nav__head}>
        <Link className={styles.nav__back} href={`/courses/${course.slug}`}>
          ← {course.title}
        </Link>
        <div className={styles.nav__progress}>
          <Progress value={progressPercent} radius="xl" color="indigo" size="sm" />
          <span className={styles.nav__progressMeta}>
            {completedCount} / {totalLessons} · {progressPercent}%
          </span>
        </div>
      </div>

      <ul className={styles.nav__modules}>
        {course.modules.map(module => (
          <li key={module.id} className={styles.module}>
            <h4 className={styles.module__title}>{module.title}</h4>
            <ul className={styles.module__lessons}>
              {module.lessons.map(lesson => {
                const isDone = completed.has(lesson.id)
                const isCurrent = lesson.id === currentLessonId
                const className = [
                  styles.lesson,
                  isCurrent ? styles.lesson_current : null,
                  isDone ? styles.lesson_done : null
                ]
                  .filter(Boolean)
                  .join(' ')
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/learn/${course.slug}/${lesson.id}`}
                      className={className}
                      aria-current={isCurrent ? 'page' : undefined}
                    >
                      <FontAwesomeIcon
                        icon={isCurrent ? faPlay : isDone ? faCircleCheck : faCircle}
                        className={styles.lesson__icon}
                      />
                      <span className={styles.lesson__title}>{lesson.title}</span>
                      <span className={styles.lesson__minutes}>{lesson.estimatedMinutes}м</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>
    </aside>
  )
}
