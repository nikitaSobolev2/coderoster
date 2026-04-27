'use client'

import { Accordion } from '@mantine/core'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faCircle, faClock } from '@fortawesome/free-solid-svg-icons'
import type { CourseDetail, EnrollmentState } from '~/server/repositories/types'
import styles from './styles.module.scss'

export interface Props {
  course: CourseDetail
  enrollment: EnrollmentState | null
}

export default function CourseSyllabus({ course, enrollment }: Props) {
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
                  return (
                    <li key={lesson.id} className={styles.lesson}>
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
