import type { LessonDetail } from '~/server/repositories/types'
import LessonMarkdown from '../LessonMarkdown'
import styles from './styles.module.scss'

export interface Props {
  lesson: LessonDetail
}

export default function TaskPane({ lesson }: Props) {
  return (
    <section className={styles.pane}>
      <header className={styles.pane__head}>
        <span className={styles.pane__module}>
          {lesson.moduleTitle} · Урок {lesson.order}
        </span>
        <h1 className={styles.pane__title}>{lesson.title}</h1>
      </header>
      <div className={styles.pane__body}>
        <LessonMarkdown source={lesson.body} />
      </div>
    </section>
  )
}
