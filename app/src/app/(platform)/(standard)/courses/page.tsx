import { HydrateClient, api } from '~/trpc/server'
import CoursesList from '~/features/platform/courses-list/CoursesList'
import type { CoursesQuery } from '~/server/repositories/types'
import { pageTitle } from '~/shared/constants/site'
import styles from './styles.module.scss'

export const metadata = { title: pageTitle('Каталог курсов') }

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
const LANGUAGES: ReadonlySet<string> = new Set(['python', 'php'])
const DIFFICULTIES: ReadonlySet<string> = new Set(['beginner', 'intermediate', 'advanced'])
const SORTS: ReadonlySet<string> = new Set(['popular', 'newest', 'shortest'])

function parseInitialFilters(params: Record<string, string | string[] | undefined>): CoursesQuery {
  const initial: CoursesQuery = { sort: 'popular' }
  const category = pickFirst(params.category)
  if (category && CATEGORY_SLUG_PATTERN.test(category)) initial.categorySlug = category

  const query = pickFirst(params.q)
  if (query) initial.q = query.slice(0, 100)

  const language = pickFirst(params.language)
  if (language && LANGUAGES.has(language)) initial.language = language as CoursesQuery['language']

  const difficulty = pickFirst(params.difficulty)
  if (difficulty && DIFFICULTIES.has(difficulty)) {
    initial.difficulty = difficulty as CoursesQuery['difficulty']
  }

  const sort = pickFirst(params.sort)
  if (sort && SORTS.has(sort)) initial.sort = sort as CoursesQuery['sort']

  return initial
}

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}
