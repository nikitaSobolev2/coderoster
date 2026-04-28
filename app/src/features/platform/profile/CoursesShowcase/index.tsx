'use client'

import Link from 'next/link'
import { Progress, Tabs } from '@mantine/core'
import type { CourseShowcase } from '~/server/repositories/types'
import { formatStableDateDdMmYyyy } from '~/shared/lib/formatStableDate'
import styles from './styles.module.scss'

export interface Props {
  active: CourseShowcase[]
  finished: CourseShowcase[]
}

export default function CoursesShowcase({ active, finished }: Props) {
  return (
    <section className={styles.section}>
      <header className={styles.section__head}>
        <h3 className={styles.section__title}>Курсы</h3>
      </header>
      <Tabs defaultValue="active" classNames={{ tab: styles.tab }}>
        <Tabs.List>
          <Tabs.Tab value="active">Активные ({active.length})</Tabs.Tab>
          <Tabs.Tab value="finished">Завершённые ({finished.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="active" className={styles.panel}>
          {active.length === 0 ? (
            <Empty hint="Нет активных курсов." />
          ) : (
            <ul className={styles.list}>
              {active.map(({ course, enrollment }) => (
                <li key={course.slug}>
                  <Link className={styles.row} href={`/courses/${course.slug}`}>
                    <span className={styles.row__title}>{course.title}</span>
                    <Progress
                      value={enrollment.progressPercent}
                      radius="xl"
                      size="sm"
                      color="indigo"
                    />
                    <span className={styles.row__progress}>{enrollment.progressPercent}%</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="finished" className={styles.panel}>
          {finished.length === 0 ? (
            <Empty hint="Завершённых курсов пока нет." />
          ) : (
            <ul className={styles.list}>
              {finished.map(({ course, enrollment }) => (
                <li key={course.slug}>
                  <Link className={styles.row} href={`/courses/${course.slug}`}>
                    <span className={styles.row__title}>{course.title}</span>
                    <span className={styles.row__date}>
                      {enrollment.finishedAt
                        ? formatStableDateDdMmYyyy(enrollment.finishedAt)
                        : '—'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tabs.Panel>
      </Tabs>
    </section>
  )
}

function Empty({ hint }: { hint: string }) {
  return <div className={styles.empty}>{hint}</div>
}
