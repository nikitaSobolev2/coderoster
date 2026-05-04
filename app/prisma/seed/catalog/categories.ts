import { prisma } from '../lib/client'

const LEGACY_ROOTS: {
  slug: string
  title: string
  summary: string
  iconKey: string
  order: number
}[] = [
  { slug: 'python', title: 'Python', summary: 'Курсы по Python', iconKey: 'python', order: 1 },
  { slug: 'php', title: 'PHP', summary: 'Курсы по PHP', iconKey: 'php', order: 2 },
  {
    slug: 'algorithms',
    title: 'Алгоритмы',
    summary: 'Структуры данных и интервью',
    iconKey: 'algorithm',
    order: 3
  },
  {
    slug: 'web-development',
    title: 'Веб-разработка',
    summary: 'Frontend, backend и протоколы',
    iconKey: 'globe',
    order: 4
  },
  {
    slug: 'databases',
    title: 'Базы данных',
    summary: 'SQL, индексы, моделирование',
    iconKey: 'database',
    order: 5
  }
]

/** Пять новых корневых веток каталога (по одной на образовательный блок). */
const SEED_ROOT_BLOCKS: {
  slug: string
  title: string
  summary: string
  iconKey: string
  order: number
  children: { slug: string; title: string; summary: string; order: number }[]
}[] = [
  {
    slug: 'seed-root-env',
    title: 'Окружение и первые шаги',
    summary: 'Запуск кода, скрипты, отладка',
    iconKey: 'terminal',
    order: 10,
    children: [
      {
        slug: 'seed-leaf-env-io',
        title: 'Ввод-вывод и скрипты',
        summary: 'print, input, аргументы',
        order: 1
      },
      {
        slug: 'seed-leaf-env-types',
        title: 'Типы и преобразования',
        summary: 'int, float, str, bool',
        order: 2
      },
      {
        slug: 'seed-leaf-env-errors',
        title: 'Исключения и отладка',
        summary: 'try/except, сообщения об ошибках',
        order: 3
      }
    ]
  },
  {
    slug: 'seed-root-syntax',
    title: 'Синтаксис и коллекции',
    summary: 'Функции, списки, словари',
    iconKey: 'code',
    order: 11,
    children: [
      {
        slug: 'seed-leaf-syn-funcs',
        title: 'Функции и области видимости',
        summary: 'def, return, параметры',
        order: 1
      },
      {
        slug: 'seed-leaf-syn-lists',
        title: 'Списки и генераторы',
        summary: 'list, comprehension',
        order: 2
      },
      {
        slug: 'seed-leaf-syn-dicts',
        title: 'Словари и множества',
        summary: 'dict, set, подсчёты',
        order: 3
      }
    ]
  },
  {
    slug: 'seed-root-algo',
    title: 'Алгоритмы на практике',
    summary: 'Циклы, рекурсия, сортировки',
    iconKey: 'diagram-project',
    order: 12,
    children: [
      {
        slug: 'seed-leaf-algo-loops',
        title: 'Циклы и сложность',
        summary: 'for, while, оценка шагов',
        order: 1
      },
      {
        slug: 'seed-leaf-algo-rec',
        title: 'Рекурсия',
        summary: 'База и шаг',
        order: 2
      },
      {
        slug: 'seed-leaf-algo-sort',
        title: 'Сортировки и порядок',
        summary: 'sorted, ключи сортировки',
        order: 3
      }
    ]
  },
  {
    slug: 'seed-root-data',
    title: 'Данные и форматы',
    summary: 'Файлы, JSON, парсинг текста',
    iconKey: 'file-lines',
    order: 13,
    children: [
      {
        slug: 'seed-leaf-data-files',
        title: 'Файлы и кодировки',
        summary: 'open, read, write',
        order: 1
      },
      {
        slug: 'seed-leaf-data-json',
        title: 'JSON и сериализация',
        summary: 'json.dumps, json.loads',
        order: 2
      },
      {
        slug: 'seed-leaf-data-parse',
        title: 'Парсинг строк',
        summary: 'split, strip, форматы',
        order: 3
      }
    ]
  },
  {
    slug: 'seed-root-applied',
    title: 'Прикладной Python',
    summary: 'HTTP, ООП, стандартная библиотека',
    iconKey: 'gears',
    order: 14,
    children: [
      {
        slug: 'seed-leaf-app-http',
        title: 'Сетевые задачи в Python',
        summary: 'Заголовки, URL, имитация запросов',
        order: 1
      },
      {
        slug: 'seed-leaf-app-oop',
        title: 'ООП в Python',
        summary: 'Классы, методы, dataclass',
        order: 2
      },
      {
        slug: 'seed-leaf-app-stdlib',
        title: 'Стандартная библиотека',
        summary: 'itertools, functools, datetime',
        order: 3
      }
    ]
  }
]

/**
 * Привязка блоков `seed-root-*` к легаси-корням mega-menu (Python, Алгоритмы, …).
 */
const SEED_ROOT_LEGACY_PARENT_SLUG: Record<string, string> = {
  'seed-root-env': 'python',
  'seed-root-syntax': 'python',
  'seed-root-algo': 'algorithms',
  'seed-root-data': 'databases',
  'seed-root-applied': 'web-development'
}

export type CatalogLeafMap = Record<string, string>

export async function seedCatalogCategories(authorId: string): Promise<CatalogLeafMap> {
  const legacyIdBySlug = new Map<string, string>()
  for (const definition of LEGACY_ROOTS) {
    const row = await prisma.courseCategory.upsert({
      where: { slug: definition.slug },
      update: {
        title: definition.title,
        summary: definition.summary,
        iconKey: definition.iconKey,
        order: definition.order,
        authorId,
        parentCategoryId: null
      },
      create: {
        slug: definition.slug,
        title: definition.title,
        summary: definition.summary,
        iconKey: definition.iconKey,
        order: definition.order,
        authorId
      }
    })
    legacyIdBySlug.set(definition.slug, row.id)
  }

  const leafIds: CatalogLeafMap = {}
  for (const block of SEED_ROOT_BLOCKS) {
    const underLegacy = SEED_ROOT_LEGACY_PARENT_SLUG[block.slug]
    const parentCategoryId = underLegacy ? (legacyIdBySlug.get(underLegacy) ?? null) : null

    const parent = await prisma.courseCategory.upsert({
      where: { slug: block.slug },
      update: {
        title: block.title,
        summary: block.summary,
        iconKey: block.iconKey,
        order: block.order,
        authorId,
        parentCategoryId
      },
      create: {
        slug: block.slug,
        title: block.title,
        summary: block.summary,
        iconKey: block.iconKey,
        order: block.order,
        authorId,
        parentCategoryId
      }
    })
    for (const child of block.children) {
      const row = await prisma.courseCategory.upsert({
        where: { slug: child.slug },
        update: {
          title: child.title,
          summary: child.summary,
          order: child.order,
          parentCategoryId: parent.id,
          authorId
        },
        create: {
          slug: child.slug,
          title: child.title,
          summary: child.summary,
          order: child.order,
          parentCategoryId: parent.id,
          authorId
        }
      })
      leafIds[child.slug] = row.id
    }
  }
  return leafIds
}

/** Порядок листьев = порядок из 15 курсов в `courseDefinitions`. */
export const COURSE_LEAF_SLUGS = SEED_ROOT_BLOCKS.flatMap(b => b.children.map(c => c.slug))
