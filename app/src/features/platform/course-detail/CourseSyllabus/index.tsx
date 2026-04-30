'use client'

import { Accordion, Badge } from '@mantine/core'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faCircle, faClock, faLock } from '@fortawesome/free-solid-svg-icons'
import type { CourseDetail, EnrollmentState } from '~/server/repositories/types'
import { requiredTierForTask } from '~/shared/lib/planTier'
import { formatPremiumLessonAccessLabel } from '~/shared/lib/premiumLabels'
import styles from './styles.module.scss'

export interface Props {
  course: CourseDetail
  enrollment: EnrollmentState | null
  /** `Plan.tierLevel` for current viewer; `0` when anonymous. */
  viewerEffectiveTier: number
}

export default function CourseSyllabus({ course, enrollment, viewerEffectiveTier }: Props) {
  const completedSet = new Set(enrollment?.completedLessonIds ?? [])

  return (
    <section className={styles.syllabus}>
      <h2 className={styles.syllabus__title}>Программа</h2>
      <Accordion
        multiple
        defaultValue={course.modules.map(module => module.id)}
        classNames={{
          item: styles.syllabus__item,
          control: styles.syllabus__control,
          panel: styles.syllabus__panel,
          chevron: styles.syllabus__chevron
        }}
      >
        {course.modules.map(module => (
          <Accordion.Item key={module.id} value={module.id}>
            <Accordion.Control>
              <div className={styles.module}>
                <span className={styles.module__title}>{module.title}</span>
                <span className={styles.module__meta}>{module.lessons.length} уроков</span>
              </div>
            </Accordion.Control>
            <Accordion.Panel>
              <ul className={styles.lessons}>
                {module.lessons.map(lesson => {
                  const completed = completedSet.has(lesson.id)
                  const needTier = requiredTierForTask(course.tierRequired, lesson)
                  const locked = viewerEffectiveTier < needTier
                  return (
                    <li
                      key={lesson.id}
                      className={[styles.lesson, locked ? styles.lesson_locked : '']
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <FontAwesomeIcon
                        icon={completed ? faCircleCheck : faCircle}
                        className={completed ? styles.lesson__iconDone : styles.lesson__iconIdle}
                      />
                      {enrollment ? (
                        <Link
                          className={styles.lesson__link}
                          href={`/learn/${course.slug}/${lesson.id}`}
                        >
                          {lesson.title}
                        </Link>
                      ) : (
                        <span className={styles.lesson__title}>{lesson.title}</span>
                      )}
                      {needTier > 0 || lesson.isPremium ? (
                        <Badge
                          size="xs"
                          variant="outline"
                          color="grape"
                          className={styles.lesson__tier}
                        >
                          {formatPremiumLessonAccessLabel(needTier)}
                        </Badge>
                      ) : null}
                      {locked ? (
                        <FontAwesomeIcon
                          icon={faLock}
                          className={styles.lesson__lock}
                          title="Нужен Премиум"
                          titleId={`syllabus-lock-title-${lesson.id}`}
                        />
                      ) : null}
                      <span className={styles.lesson__estimate}>
                        <FontAwesomeIcon icon={faClock} />
                        {lesson.estimatedMinutes} мин
                      </span>
                    </li>
                  )
                })}
              </ul>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </section>
  )
}
