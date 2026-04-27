import { PrismaClient, Role, CourseStatus, TaskKind } from '@prisma/client'

/**
 * Seeds the database with a small set of fixtures matching the Fake repository
 * data so the platform pages render meaningfully on a fresh install.
 */
const prisma = new PrismaClient()

async function main() {
  console.log('[seed] start')
  const author = await upsertAuthor()
  const phpAuthor = await upsertSecondaryAuthor()
  const algoAuthor = await upsertAlgoAuthor()

  await seedAchievements()
  await seedPython(author.id)
  await seedPhp(phpAuthor.id)
  await seedAlgo(algoAuthor.id)

  console.log('[seed] done')
}

async function upsertAuthor() {
  return prisma.user.upsert({
    where: { username: 'codenikita' },
    update: {},
    create: {
      workosUserId: 'seed-codenikita',
      email: 'nikita@coderoster.dev',
      username: 'codenikita',
      displayName: 'Никита Соболев',
      bio: 'Учусь, ломаю, повторяю. Backend по любви, фронтенд по необходимости.',
      role: Role.AUTHOR,
      socials: {
        github: 'https://github.com/nikitaSobolev2',
        website: 'https://t.me/sobolevNikitaWD'
      }
    }
  })
}

async function upsertSecondaryAuthor() {
  return prisma.user.upsert({
    where: { username: 'php_pro' },
    update: {},
    create: {
      workosUserId: 'seed-php_pro',
      email: 'maria@coderoster.dev',
      username: 'php_pro',
      displayName: 'Мария Лазарева',
      role: Role.AUTHOR
    }
  })
}

async function upsertAlgoAuthor() {
  return prisma.user.upsert({
    where: { username: 'algo_dasha' },
    update: {},
    create: {
      workosUserId: 'seed-algo_dasha',
      email: 'dasha@coderoster.dev',
      username: 'algo_dasha',
      displayName: 'Даша Кравцова',
      role: Role.AUTHOR
    }
  })
}

async function seedAchievements() {
  const items = [
    {
      slug: 'first-steps',
      title: 'Первые шаги',
      description: 'Заверши первый урок',
      category: 'progression',
      rarity: 'common',
      coverImage: 'shoe-prints'
    },
    {
      slug: 'on-fire',
      title: 'В огне',
      description: 'Серия 7 дней подряд',
      category: 'streak',
      rarity: 'rare',
      coverImage: 'fire'
    },
    {
      slug: 'all-clear',
      title: 'Чистый зачёт',
      description: 'Заверши все задания одного курса',
      category: 'completionist',
      rarity: 'epic',
      coverImage: 'circle-check'
    },
    {
      slug: 'speed-coder',
      title: 'Скорострел',
      description: 'Сдай задание быстрее лимита',
      category: 'speed',
      rarity: 'rare',
      coverImage: 'bolt'
    },
    {
      slug: 'night-owl',
      title: '???',
      description: 'Скрытое условие',
      category: 'hidden',
      rarity: 'legendary',
      coverImage: 'moon',
      hidden: true
    }
  ]
  for (const item of items) {
    await prisma.achievement.upsert({
      where: { slug: item.slug },
      update: {},
      create: item
    })
  }
}

async function seedPython(authorId: string) {
  const course = await prisma.course.upsert({
    where: { slug: 'python-basics' },
    update: {},
    create: {
      slug: 'python-basics',
      title: 'Python с нуля',
      summary: 'Поставим первую программу, переменные, ветвления и циклы — на реальных задачах.',
      shortSummary: 'От первой переменной до уверенного синтаксиса.',
      description:
        'Курс ведёт от установки интерпретатора до уверенного решения базовых задач. Каждый урок заканчивается интерактивной задачей с проверкой.',
      language: 'python',
      difficulty: 'beginner',
      durationHours: 12,
      xpReward: 1200,
      tags: ['основы', 'синтаксис', 'практика'],
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId
    }
  })
  await seedModule(course.id, 'mod-py-1', 'Старт', 'Установка, запуск, первая программа.', 1, [
    {
      slug: 'l-py-1-1',
      title: 'Hello, World',
      starter: '# Выведи строку Hello, World на экран\n',
      body: '## Привет, мир\n\nКлассика: первая программа выводит строку `Hello, World` в консоль.'
    },
    {
      slug: 'l-py-1-2',
      title: 'Переменные',
      starter:
        '# Создай переменную name со значением "CodeRoster" и выведи её через print\nname = ""\n',
      body: '## Переменные\n\nПрисвой переменной `name` строку `"CodeRoster"` и выведи её.'
    },
    {
      slug: 'l-py-1-3',
      title: 'Числа и строки',
      starter: '# Сложи числа a и b и выведи результат\na = 2\nb = 3\n',
      body: '## Числа и строки\n\nСложи `a` и `b`, выведи число.'
    }
  ])
  await seedModule(
    course.id,
    'mod-py-2',
    'Ветвления и циклы',
    'if / else, while, for и неизбежные баги.',
    2,
    [
      {
        slug: 'l-py-2-1',
        title: 'Условные выражения',
        starter: '# Выведи "even" если n чётное, иначе "odd"\nn = 7\n',
        body: '## Условные выражения\n\nИспользуй `if`/`else`.'
      },
      {
        slug: 'l-py-2-2',
        title: 'Цикл while',
        starter: '# Выведи числа от 1 до 5 через while\n',
        body: '## Цикл while\n\nИтерируй пока условие истинно.'
      },
      {
        slug: 'l-py-2-3',
        title: 'Цикл for',
        starter: '# Сумма от 1 до n включительно через for\nn = 5\n',
        body: '## Цикл for\n\nИспользуй `range`.'
      }
    ]
  )
  await seedModule(course.id, 'mod-py-3', 'Функции', 'Параметры, возврат, область видимости.', 3, [
    {
      slug: 'l-py-3-1',
      title: 'Объявление функции',
      starter: 'def greet(name):\n    pass\n\nprint(greet("CodeRoster"))\n',
      body: '## Объявление функции\n\nВерни строку `Hello, <name>`.'
    },
    {
      slug: 'l-py-3-2',
      title: 'Аргументы по умолчанию',
      starter: 'def greet(name="мир"):\n    pass\n\nprint(greet())\n',
      body: '## Аргументы по умолчанию\n\nЕсли имя не передали — используй `мир`.'
    }
  ])
}

async function seedPhp(authorId: string) {
  const course = await prisma.course.upsert({
    where: { slug: 'php-api-fundamentals' },
    update: {},
    create: {
      slug: 'php-api-fundamentals',
      title: 'PHP: серверный API',
      summary: 'Маршрутизация, JSON, валидация, БД — без фреймворков.',
      shortSummary: 'Поднимем минимальный API без фреймворков.',
      description:
        'Поднимем минимальный API на PHP с нуля: маршрутизация, валидация запросов, работа с PDO, аутентификация, тесты.',
      language: 'php',
      difficulty: 'intermediate',
      durationHours: 18,
      xpReward: 2200,
      tags: ['backend', 'http', 'pdo'],
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId
    }
  })
  await seedModule(
    course.id,
    'mod-php-1',
    'HTTP и маршрутизация',
    'Запрос, ответ, заголовки.',
    1,
    [
      {
        slug: 'l-php-1-1',
        title: 'Hello, HTTP',
        starter: '<?php\n// Выведи Hello, HTTP\n',
        body: '## Hello, HTTP\n\nИспользуй `echo`.'
      },
      {
        slug: 'l-php-1-2',
        title: 'Простой роутер',
        starter: '<?php\n// Маршрутизатор: GET /ping → pong\n',
        body: '## Простой роутер\n\nРазбираем `$_SERVER[REQUEST_METHOD]`.'
      }
    ],
    'php'
  )
  await seedModule(
    course.id,
    'mod-php-2',
    'JSON и валидация',
    'Парсим, валидируем, отвечаем.',
    2,
    [
      {
        slug: 'l-php-2-1',
        title: 'JSON request body',
        starter: "<?php\n$payload = file_get_contents('php://input');\n",
        body: '## JSON request body\n\nДекодируй и выведи поле `name`.'
      },
      {
        slug: 'l-php-2-2',
        title: 'Минимальный валидатор',
        starter: '<?php\n// Минимальный валидатор\n',
        body: '## Минимальный валидатор\n\nПроверяй наличие обязательных ключей.'
      }
    ],
    'php'
  )
}

async function seedAlgo(authorId: string) {
  const course = await prisma.course.upsert({
    where: { slug: 'algorithms-introduction' },
    update: {},
    create: {
      slug: 'algorithms-introduction',
      title: 'Алгоритмы для собеседований',
      summary: 'Сложность, массивы, строки, два указателя, хэш-таблицы.',
      shortSummary: 'Базовый набор для собеседования.',
      description:
        'Базовый набор для разговора на интервью: оценим сложность, разберём типовые шаблоны на массивах и строках, потренируемся.',
      language: 'python',
      difficulty: 'advanced',
      durationHours: 24,
      xpReward: 3000,
      tags: ['собеседование', 'алгоритмы', 'big-o'],
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId
    }
  })
  await seedModule(
    course.id,
    'mod-algo-1',
    'Сложность и массивы',
    'Big-O, два указателя, скользящее окно.',
    1,
    [
      {
        slug: 'l-algo-1-1',
        title: 'Сумма двух чисел',
        starter: 'def two_sum(nums, target):\n    pass\n\nprint(two_sum([2,7,11,15], 9))\n',
        body: '## Two Sum\n\nКлассика на хэш-таблицу.'
      },
      {
        slug: 'l-algo-1-2',
        title: 'Скользящее окно',
        starter: 'def longest_unique(s):\n    pass\n',
        body: '## Скользящее окно\n\nПоддерживай множество символов.'
      }
    ]
  )
}

async function seedModule(
  courseId: string,
  externalId: string,
  title: string,
  description: string,
  order: number,
  lessons: { slug: string; title: string; starter: string; body: string }[],
  language: 'python' | 'php' = 'python'
) {
  const module = await prisma.courseModule.upsert({
    where: { courseId_order: { courseId, order } },
    update: { title, description },
    create: { courseId, title, description, order }
  })
  for (const [index, lesson] of lessons.entries()) {
    await prisma.courseTask.upsert({
      where: { moduleId_order: { moduleId: module.id, order: index + 1 } },
      update: {
        title: lesson.title,
        description: lesson.body,
        initialData: {
          slug: lesson.slug,
          predefinedCode: lesson.starter,
          language,
          hints: []
        }
      },
      create: {
        moduleId: module.id,
        title: lesson.title,
        description: lesson.body,
        order: index + 1,
        kind: TaskKind.TASK,
        estimatedMinutes: 15,
        initialData: {
          slug: lesson.slug,
          predefinedCode: lesson.starter,
          language,
          hints: []
        }
      }
    })
  }
}

main()
  .catch(error => {
    console.error('[seed] failed', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
