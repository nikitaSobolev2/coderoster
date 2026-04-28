'use client'

import { useState } from 'react'
import { Drawer } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faList, faXmark } from '@fortawesome/free-solid-svg-icons'
import type { CourseDetail } from '~/server/repositories/types'
import TaskNav from '..'
import styles from './styles.module.scss'

export interface Props {
  course: CourseDetail
  currentLessonId: string
  completedLessonIds: string[]
}

/**
 * Mobile-only: floating "Уроки" island that opens the lesson tree in a
 * bottom-anchored Mantine drawer. Re-uses the desktop `TaskNav` so module/
 * lesson rendering stays a single source of truth.
 */
export default function MobileTaskNavTrigger({
  course,
  currentLessonId,
  completedLessonIds
}: Props) {
  const [opened, setOpened] = useState(false)
  const total = course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const done = new Set(completedLessonIds)
  const completedCount = course.modules.reduce(
    (sum, m) => sum + m.lessons.filter(l => done.has(l.id)).length,
    0
  )

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpened(true)}
        aria-label="Открыть уроки"
      >
        <FontAwesomeIcon icon={faList} />
        <span>
          Уроки {completedCount}/{total}
        </span>
      </button>

      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        position="bottom"
        size="85vh"
        withCloseButton={false}
        overlayProps={{ backgroundOpacity: 0.55, blur: 6 }}
        classNames={{ content: styles.drawer, body: styles.drawer__body }}
      >
        <header className={styles.drawer__head}>
          <span className={styles.drawer__title}>Уроки курса</span>
          <button
            type="button"
            className={styles.drawer__close}
            onClick={() => setOpened(false)}
            aria-label="Закрыть"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>
        <div className={styles.drawer__nav} onClickCapture={() => setOpened(false)}>
          <TaskNav
            course={course}
            currentLessonId={currentLessonId}
            completedLessonIds={completedLessonIds}
          />
        </div>
      </Drawer>
    </>
  )
}
