import { HydrateClient, api } from '~/trpc/server'
import CoursesList from '~/features/platform/courses-list/CoursesList'
import type { CoursesQuery, Difficulty, Language } from '~/server/repositories/types'
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

/**
 * Facets: repeated keys (`?language=python&language=php`) or comma-separated (`?language=python,php`).
 */
function parseInitialFilters(params: Record<string, string | string[] | undefined>): CoursesQuery {
  const initial: CoursesQuery = { sort: 'popular' }

  const categoryTokens = pickParamTokens(params.category)
  const categorySlugs = unique(
    categoryTokens.map(t => t.trim()).filter(t => CATEGORY_SLUG_PATTERN.test(t))
  )
  if (categorySlugs.length > 0) initial.categorySlugs = categorySlugs

  const query = pickFirst(params.q)
  if (query) initial.q = query.slice(0, 100)

  const languageTokens = pickParamTokens(params.language)
  const languages = unique(languageTokens.filter((t): t is Language => LANGUAGES.has(t)))
  if (languages.length > 0) initial.languages = languages

  const difficultyTokens = pickParamTokens(params.difficulty)
  const difficulties = unique(difficultyTokens.filter((t): t is Difficulty => DIFFICULTIES.has(t)))
  if (difficulties.length > 0) initial.difficulties = difficulties

  const sort = pickFirst(params.sort)
  if (sort && SORTS.has(sort)) initial.sort = sort as CoursesQuery['sort']

  return initial
}

function pickParamTokens(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  const raw = Array.isArray(value) ? value : [value]
  return raw.flatMap(part =>
    part
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  )
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}
