'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Progress, Tooltip } from '@mantine/core'
import clsx from 'clsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faChevronLeft,
  faCircleCheck,
  faLock,
  faPlay
} from '@fortawesome/free-solid-svg-icons'
import type { CourseDetail } from '~/server/repositories/types'
import { requiredTierForTask } from '~/shared/lib/planTier'
import styles from './styles.module.scss'

export interface Props {
  course: CourseDetail
  currentLessonId: string
  completedLessonIds: string[]
  /** Viewer effective `Plan.tierLevel` (0 = free). */
  viewerEffectiveTier: number
  /** Narrow rail: icons + tooltips only (desktop resized nav). */
  minimal?: boolean
}

export default function TaskNav({
  course,
  currentLessonId,
  completedLessonIds,
  viewerEffectiveTier,
  minimal = false
}: Props) {
  const completed = new Set(completedLessonIds)
  const flat = course.modules.flatMap(module => module.lessons.map(lesson => ({ module, lesson })))
  const accessibleItems = flat.filter(
    ({ lesson }) => requiredTierForTask(course.tierRequired, lesson) <= viewerEffectiveTier
  )
  const totalForProgress = accessibleItems.length
  const completedAccessible = accessibleItems.filter(({ lesson }) =>
    completed.has(lesson.id)
  ).length
  const progressPercent =
    totalForProgress === 0 ? 0 : Math.round((completedAccessible / totalForProgress) * 100)

  const backHref = `/courses/${course.slug}`

  return (
    <aside className={minimal ? `${styles.nav} ${styles.nav_minimal}` : styles.nav}>
      <div className={styles.nav__head}>
        {minimal ? (
          <Tooltip label={course.title} position="right" withArrow>
            <Link
              className={styles.nav__backIcon}
              href={backHref}
              aria-label={`К курсу: ${course.title}`}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </Link>
          </Tooltip>
        ) : (
          <Link className={styles.nav__back} href={backHref}>
            <FontAwesomeIcon icon={faArrowLeft} className={styles.nav__backArrow} />
            {course.title}
          </Link>
        )}
        {!minimal ? (
          <div className={styles.nav__progress}>
            <Progress value={progressPercent} radius="xl" color="indigo" size="sm" />
            <span className={styles.nav__progressMeta}>
              {completedAccessible} / {totalForProgress > 0 ? totalForProgress : flat.length} ·{' '}
              {progressPercent}%
            </span>
          </div>
        ) : null}
      </div>

      <ul className={styles.nav__modules}>
        {course.modules.map((module, moduleIndex) => (
          <li
            key={module.id}
            className={clsx(
              styles.module,
              minimal && moduleIndex > 0 && styles.module_afterDivider
            )}
          >
            <h4 className={minimal ? styles.module__titleMinimal : styles.module__title}>
              {module.title}
            </h4>
            <ul className={styles.module__lessons}>
              {module.lessons.map((lesson, lessonIndexInModule) => {
                const taskOrdinal = lessonIndexInModule + 1
                const isDone = completed.has(lesson.id)
                const isCurrent = lesson.id === currentLessonId
                const locked =
                  requiredTierForTask(course.tierRequired, lesson) > viewerEffectiveTier
                const showOrdinalInRail = minimal && !locked && !isDone && !isCurrent
                const className = clsx(
                  styles.lesson,
                  minimal && styles.lesson_minimal,
                  isCurrent && styles.lesson_current,
                  isDone && styles.lesson_done,
                  locked && styles.lesson_locked
                )

                let leading: ReactNode
                if (locked) {
                  leading = (
                    <FontAwesomeIcon icon={faLock} className={clsx(styles.lesson__icon, 'fa-fw')} />
                  )
                } else if (isCurrent) {
                  leading = (
                    <FontAwesomeIcon icon={faPlay} className={clsx(styles.lesson__icon, 'fa-fw')} />
                  )
                } else if (isDone) {
                  leading = (
                    <FontAwesomeIcon
                      icon={faCircleCheck}
                      className={clsx(styles.lesson__icon, 'fa-fw')}
                    />
                  )
                } else if (minimal) {
                  leading = (
                    <span className={styles.lesson__ordinal} aria-hidden>
                      {taskOrdinal}
                    </span>
                  )
                } else {
                  leading = (
                    <span className={styles.lesson__ordinalExpanded} aria-hidden>
                      {taskOrdinal}
                    </span>
                  )
                }

                const link = (
                  <Link
                    href={`/learn/${course.slug}/${lesson.id}`}
                    className={className}
                    aria-current={isCurrent ? 'page' : undefined}
                    aria-label={
                      locked
                        ? `${lesson.title} (заблокирован)`
                        : `${lesson.title}${showOrdinalInRail ? `, задание ${taskOrdinal}` : ''}`
                    }
                    prefetch={false}
                  >
                    {leading}
                    <span className={styles.lesson__title}>{lesson.title}</span>
                    <span className={styles.lesson__minutes}>{lesson.estimatedMinutes}м</span>
                  </Link>
                )
                return (
                  <li key={lesson.id}>
                    {minimal ? (
                      <Tooltip
                        label={`${lesson.title} · ${lesson.estimatedMinutes} мин`}
                        position="right"
                        withArrow
                      >
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
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
