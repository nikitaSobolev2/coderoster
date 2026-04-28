import { HydrateClient, api } from '~/trpc/server'
import CoursesList from '~/features/platform/courses-list/CoursesList'
import type { CoursesQuery } from '~/server/repositories/types'
import styles from './styles.module.scss'

export const metadata = { title: 'Каталог курсов — CodeRoster' }

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const initialFilters = parseInitialFilters(params)

  await Promise.all([
    api.course.list.prefetch(initialFilters),
    api.course.listCategories.prefetch()
  ])

  return (
    <HydrateClient>
      <section className={styles.page}>
        <header className={styles.page__hero}>
          <span className={styles.page__eyebrow}>Каталог</span>
          <h1 className={styles.page__title}>Курсы</h1>
          <p className={styles.page__copy}>
            Структурированные траектории по языкам и темам — от первой переменной до уверенного кода
            уровня middle.
          </p>
        </header>
        <CoursesList initialFilters={initialFilters} />
      </section>
    </HydrateClient>
  )
}

const CATEGORY_SLUG_PATTERN = /^[a-z0-9-]+$/

function parseInitialFilters(params: Record<string, string | string[] | undefined>): CoursesQuery {
  const initial: CoursesQuery = { sort: 'popular' }
  const category = pickFirst(params.category)
  if (category && CATEGORY_SLUG_PATTERN.test(category)) initial.categorySlug = category
  return initial
}

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}
