import { HydrateClient, api } from '~/trpc/server'
import CoursesList from '~/features/platform/courses-list/CoursesList'
import styles from './styles.module.scss'

export const metadata = { title: 'Каталог курсов — CodeRoster' }

export default async function CoursesPage() {
  await api.course.list.prefetch({ sort: 'popular' })

  return (
    <HydrateClient>
      <section className={styles.page}>
        <header className={styles.page__hero}>
          <span className={styles.page__eyebrow}>Каталог</span>
          <h1 className={styles.page__title}>Курсы</h1>
          <p className={styles.page__copy}>
            Структурированные траектории по языкам и темам — от первой переменной до уверенного
            кода уровня middle.
          </p>
        </header>
        <CoursesList />
      </section>
    </HydrateClient>
  )
}
