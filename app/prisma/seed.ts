import { PrismaClient, Role, CourseStatus, TaskKind, ContentPagePlacement } from '@prisma/client'

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
  await upsertDemoLearnerNikareich()

  await seedAchievements()
  const categories = await seedCourseCategories(author.id)
  await seedPython(author.id, categories.python)
  await seedPhp(phpAuthor.id, categories.php)
  await seedAlgo(algoAuthor.id, categories.algorithms)
  await seedContentPages()
  await seedAppSettings()
  await promoteBootstrapAdmin()

  console.log('[seed] done')
}

interface CategoryIdMap {
  python: string
  php: string
  algorithms: string
  webDev: string
  databases: string
}

async function seedCourseCategories(authorId: string): Promise<CategoryIdMap> {
  const definitions = [
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
  const ids = {} as CategoryIdMap
  for (const definition of definitions) {
    const row = await prisma.courseCategory.upsert({
      where: { slug: definition.slug },
      update: {
        title: definition.title,
        summary: definition.summary,
        iconKey: definition.iconKey,
        order: definition.order
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
    if (definition.slug === 'python') ids.python = row.id
    if (definition.slug === 'php') ids.php = row.id
    if (definition.slug === 'algorithms') ids.algorithms = row.id
    if (definition.slug === 'web-development') ids.webDev = row.id
    if (definition.slug === 'databases') ids.databases = row.id
  }
  return ids
}

/**
 * Seed users use a non-routable `seed.local` domain and `seed-<username>`
 * WorkOS ids. Real WorkOS sign-ins (own emails on real domains) never collide,
 * so `UserSyncService` always creates a fresh row for the actual user.
 */
const SEED_DOMAIN = 'seed.local'
const seedEmail = (username: string) => `${username}@${SEED_DOMAIN}`

interface SeedUser {
  workosUserId: string
  username: string
  displayName: string
  bio?: string
  role?: Role
  socials?: Record<string, string>
}

/**
 * Seeds an idempotent demo user keyed by `workosUserId`. We deliberately key
 * the upsert on `workosUserId` (never `username`) so that real WorkOS-backed
 * users with the same nickname are never overwritten by a re-run of the seed.
 * Real-user usernames coming from `UserSyncService` get a numeric suffix when
 * they collide with these reserved demo names.
 */
async function upsertSeedUser(input: SeedUser) {
  const data = {
    email: seedEmail(input.username),
    displayName: input.displayName,
    bio: input.bio ?? '',
    role: input.role ?? Role.LEARNER,
    socials: input.socials ?? {}
  }

  const owner = await prisma.user.findUnique({ where: { username: input.username } })
  if (owner && owner.workosUserId !== input.workosUserId) {
    console.warn(
      `[seed] username "${input.username}" already owned by ${owner.workosUserId} — leaving real user untouched.`
    )
    return owner
  }

  return prisma.user.upsert({
    where: { workosUserId: input.workosUserId },
    update: data,
    create: { workosUserId: input.workosUserId, username: input.username, ...data }
  })
}

async function upsertAuthor() {
  return upsertSeedUser({
    workosUserId: 'seed-codenikita',
    username: 'codenikita',
    displayName: 'Никита Соболев',
    bio: 'Учусь, ломаю, повторяю. Backend по любви, фронтенд по необходимости.',
    role: Role.AUTHOR,
    socials: {
      github: 'https://github.com/nikitaSobolev2',
      website: 'https://t.me/sobolevNikitaWD'
    }
  })
}

async function upsertSecondaryAuthor() {
  return upsertSeedUser({
    workosUserId: 'seed-php_pro',
    username: 'php_pro',
    displayName: 'Мария Лазарева',
    role: Role.AUTHOR
  })
}

async function upsertAlgoAuthor() {
  return upsertSeedUser({
    workosUserId: 'seed-algo_dasha',
    username: 'algo_dasha',
    displayName: 'Даша Кравцова',
    role: Role.AUTHOR
  })
}

/** Demo learner so `/u/nikareich` resolves on fresh DB. */
async function upsertDemoLearnerNikareich() {
  return upsertSeedUser({
    workosUserId: 'seed-nikareich',
    username: 'nikareich',
    displayName: 'Ника Райх',
    role: Role.LEARNER
  })
}

async function seedAchievements() {
  const items: {
    slug: string
    title: string
    description: string
    category: string
    rarity: string
    coverImage: string
    hidden?: boolean
    goal?: number
  }[] = [
    {
      slug: 'first-steps',
      title: 'Первые шаги',
      description: 'Заверши первый урок',
      category: 'progression',
      rarity: 'common',
      coverImage: 'shoe-prints',
      goal: 1
    },
    {
      slug: 'on-fire',
      title: 'В огне',
      description: 'Серия 7 дней подряд',
      category: 'streak',
      rarity: 'rare',
      coverImage: 'fire',
      goal: 7
    },
    {
      slug: 'all-clear',
      title: 'Чистый зачёт',
      description: 'Заверши все задания одного курса',
      category: 'completionist',
      rarity: 'epic',
      coverImage: 'circle-check',
      goal: 1
    },
    {
      slug: 'speed-coder',
      title: 'Скорострел',
      description: 'Сдай задание быстрее лимита',
      category: 'speed',
      rarity: 'rare',
      coverImage: 'bolt',
      goal: 1
    },
    {
      slug: 'night-owl',
      title: '???',
      description: 'Скрытое условие',
      category: 'hidden',
      rarity: 'legendary',
      coverImage: 'moon',
      hidden: true,
      goal: 1
    },
    {
      slug: 'polyglot',
      title: 'Полиглот',
      description: 'Сдай задачи на двух языках',
      category: 'progression',
      rarity: 'rare',
      coverImage: 'star',
      goal: 2
    },
    {
      slug: 'marathon',
      title: 'Марафонец',
      description: '10 уроков за один день',
      category: 'progression',
      rarity: 'epic',
      coverImage: 'bolt',
      goal: 10
    },
    {
      slug: 'daily-grinder',
      title: 'Дейли-граниль',
      description: '7 дейликов очищены',
      category: 'streak',
      rarity: 'rare',
      coverImage: 'fire',
      goal: 7
    },
    {
      slug: 'weekly-champion',
      title: 'Чемпион недели',
      description: 'Сдан недельный спидран',
      category: 'completionist',
      rarity: 'epic',
      coverImage: 'trophy',
      goal: 1
    },
    {
      slug: 'comeback',
      title: 'Возвращение',
      description: 'Вернулся после недели тишины',
      category: 'hidden',
      rarity: 'legendary',
      coverImage: 'moon',
      hidden: true,
      goal: 1
    }
  ]
  for (const item of items) {
    await prisma.achievement.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: item.description,
        category: item.category,
        rarity: item.rarity,
        coverImage: item.coverImage,
        hidden: item.hidden ?? false,
        goal: item.goal ?? null
      },
      create: {
        slug: item.slug,
        title: item.title,
        description: item.description,
        category: item.category,
        rarity: item.rarity,
        coverImage: item.coverImage,
        hidden: item.hidden ?? false,
        goal: item.goal ?? null
      }
    })
  }
}

async function seedPython(authorId: string, categoryId: string) {
  const course = await prisma.course.upsert({
    where: { slug: 'python-basics' },
    update: { categoryId },
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
      authorId,
      categoryId
    }
  })
  await seedModule(course.id, 'mod-py-1', 'Старт', 'Установка, запуск, первая программа.', 1, [
    {
      slug: 'l-py-1-1',
      title: 'Hello, World',
      starter: '# Выведи строку Hello, World на экран\n',
      body: '## Привет, мир\n\nКлассика: первая программа выводит строку `Hello, World` в консоль.',
      tests: [
        {
          name: 'Печать ровно «Hello, World» (как в примере приветствия)',
          expected: 'Hello, World'
        }
      ]
    },
    {
      slug: 'l-py-1-2',
      title: 'Переменные',
      starter:
        '# Создай переменную name со значением "CodeRoster" и выведи её через print\nname = ""\n',
      body: '## Переменные\n\nПрисвой переменной `name` строку `"CodeRoster"` и выведи её.',
      tests: [{ name: 'Имя платформы в stdout: «CodeRoster»', expected: 'CodeRoster' }]
    },
    {
      slug: 'l-py-1-3',
      title: 'Числа и строки',
      starter: '# Сложи числа a и b и выведи результат\na = 2\nb = 3\n',
      body: '## Числа и строки\n\nСложи `a` и `b`, выведи число.',
      tests: [{ name: 'Сумма 2 + 3 выводится числом 5', expected: '5' }]
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
        body: '## Условные выражения\n\nИспользуй `if`/`else`.',
        tests: [{ name: 'Для 7 возвращается метка «odd»', expected: 'odd' }]
      },
      {
        slug: 'l-py-2-2',
        title: 'Цикл while',
        starter: '# Выведи числа от 1 до 5 через while\n',
        body: '## Цикл while\n\nИтерируй пока условие истинно.',
        tests: [{ name: 'Числа 1…5, каждое с новой строки', expected: '1\n2\n3\n4\n5' }]
      },
      {
        slug: 'l-py-2-3',
        title: 'Цикл for',
        starter: '# Сумма от 1 до n включительно через for\nn = 5\n',
        body: '## Цикл for\n\nИспользуй `range`.',
        tests: [{ name: 'Сумма 1+2+3+4+5 в stdout: 15', expected: '15' }]
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

async function seedPhp(authorId: string, categoryId: string) {
  const course = await prisma.course.upsert({
    where: { slug: 'php-api-fundamentals' },
    update: { categoryId },
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
      authorId,
      categoryId
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

async function seedAlgo(authorId: string, categoryId: string) {
  const course = await prisma.course.upsert({
    where: { slug: 'algorithms-introduction' },
    update: { categoryId },
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
      authorId,
      categoryId
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

interface SeedTest {
  name: string
  input?: string | null
  expected: string
  hidden?: boolean
}

interface SeedLesson {
  slug: string
  title: string
  starter: string
  body: string
  tests?: SeedTest[]
}

async function seedModule(
  courseId: string,
  _externalId: string,
  title: string,
  description: string,
  order: number,
  lessons: SeedLesson[],
  language: 'python' | 'php' = 'python'
) {
  const courseModule = await prisma.courseModule.upsert({
    where: { courseId_order: { courseId, order } },
    update: { title, description },
    create: { courseId, title, description, order }
  })
  for (const [index, lesson] of lessons.entries()) {
    const task = await prisma.courseTask.upsert({
      where: { moduleId_order: { moduleId: courseModule.id, order: index + 1 } },
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
        moduleId: courseModule.id,
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
    await syncAutotests(task.id, lesson.tests ?? [])
  }
}

async function seedContentPages() {
  const pages: {
    slug: string
    title: string
    excerpt: string
    body: string
    groupKey: string
    order: number
  }[] = [
    {
      slug: 'o-proekte',
      title: 'О проекте',
      excerpt: 'Зачем мы делаем CodeRoster и для кого.',
      groupKey: 'about',
      order: 1,
      body:
        '## О проекте\n\nCodeRoster — открытая платформа практической подготовки разработчиков. ' +
        'Мы делаем инструмент, в котором учат не лекциями, а боевыми задачами с реальной проверкой кода.'
    },
    {
      slug: 'career',
      title: 'Карьера',
      excerpt: 'Как мы помогаем дойти от первой задачи до офера.',
      groupKey: 'about',
      order: 2,
      body:
        '## Карьера\n\nКурсы, дейлики и спидраны выстроены так, чтобы за несколько месяцев ' +
        'дойти от первой строчки кода до уверенного интервью. Подробнее в разделе курсов.'
    },
    {
      slug: 'contacts',
      title: 'Контакты',
      excerpt: 'Связаться с командой.',
      groupKey: 'support',
      order: 1,
      body:
        '## Контакты\n\nПо любым вопросам пишите на support@coderoster.dev. ' +
        'Telegram-канал и зеркала — в подвале сайта.'
    },
    {
      slug: 'help',
      title: 'Помощь',
      excerpt: 'Частые вопросы и поддержка.',
      groupKey: 'support',
      order: 2,
      body:
        '## Помощь\n\nЕсли что-то не работает или ты не понимаешь, как пройти урок — ' +
        'напиши нам в Telegram-канал, мы стараемся отвечать в течение суток.'
    },
    {
      slug: 'privacy',
      title: 'Privacy Policy',
      excerpt: 'Как мы храним и обрабатываем твои данные.',
      groupKey: 'legal',
      order: 1,
      body:
        '## Privacy Policy\n\nМы собираем минимум персональных данных, не передаём их третьим ' +
        'лицам и удаляем по запросу. Подробности — в разделе настроек аккаунта.'
    },
    {
      slug: 'terms',
      title: 'Terms of Service',
      excerpt: 'Условия использования платформы.',
      groupKey: 'legal',
      order: 2,
      body:
        '## Terms of Service\n\nИспользуя CodeRoster, ты соглашаешься писать код ответственно: ' +
        'не нарушать законы, не атаковать инфраструктуру и не публиковать чужой материал.'
    },
    {
      slug: 'cookie',
      title: 'Cookie Policy',
      excerpt: 'Как мы используем cookies.',
      groupKey: 'legal',
      order: 3,
      body:
        '## Cookie Policy\n\nМы используем строго необходимые cookies для авторизации и ' +
        'продуктовой аналитики. Маркетинговые cookies отсутствуют.'
    },
    {
      slug: 'roadmap',
      title: 'Roadmap',
      excerpt: 'Что мы строим в ближайших релизах.',
      groupKey: 'platform',
      order: 1,
      body:
        '## Roadmap\n\nПлан публичный и обновляется в каждом спринте. Голосуй за фичи в ' +
        'Telegram-канале — мы учитываем приоритеты сообщества.'
    },
    {
      slug: 'changelog',
      title: 'Changelog',
      excerpt: 'История релизов и обновлений.',
      groupKey: 'platform',
      order: 2,
      body:
        '## Changelog\n\nКаждый релиз получает запись с описанием новых курсов, фиксов и ' +
        'улучшений. Архив — на этой странице.'
    },
    {
      slug: 'status',
      title: 'Статус сервиса',
      excerpt: 'Доступность платформы.',
      groupKey: 'resources',
      order: 1,
      body:
        '## Статус сервиса\n\nПри плановых работах или инцидентах мы публикуем апдейты в ' +
        'Telegram-канале и здесь. Если страница не открывается — проверь сначала статус.'
    },
    {
      slug: 'blog',
      title: 'Блог',
      excerpt: 'Заметки из практики и индустрии.',
      groupKey: 'resources',
      order: 2,
      body:
        '## Блог\n\nДлинные тексты от авторов курсов: разбор сложных тем, личный опыт, разборы ' +
        'собеседований. Подписывайся на рассылку, чтобы не пропустить.'
    }
  ]
  for (const page of pages) {
    await prisma.contentPage.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        excerpt: page.excerpt,
        body: page.body,
        groupKey: page.groupKey,
        order: page.order,
        published: true,
        placement: ContentPagePlacement.FOOTER
      },
      create: {
        slug: page.slug,
        title: page.title,
        excerpt: page.excerpt,
        body: page.body,
        groupKey: page.groupKey,
        order: page.order,
        published: true,
        placement: ContentPagePlacement.FOOTER
      }
    })
  }
}

async function seedAppSettings() {
  await prisma.appSetting.upsert({
    where: { key: 'allowed_languages' },
    update: { value: ['python', 'php'] },
    create: { key: 'allowed_languages', value: ['python', 'php'] }
  })
}

async function promoteBootstrapAdmin() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL
  if (!email) return
  const existing = await prisma.user.findUnique({ where: { email } })
  if (!existing) {
    console.log(`[seed] ADMIN_BOOTSTRAP_EMAIL ${email} not registered yet — sync on first login.`)
    return
  }
  if (existing.role === Role.ADMIN) return
  await prisma.user.update({ where: { id: existing.id }, data: { role: Role.ADMIN } })
  console.log(`[seed] promoted ${email} to ADMIN`)
}

async function syncAutotests(courseTaskId: string, tests: SeedTest[]) {
  await prisma.courseTaskAutotest.deleteMany({ where: { courseTaskId } })
  if (tests.length === 0) return
  await prisma.courseTaskAutotest.createMany({
    data: tests.map((test, index) => ({
      courseTaskId,
      order: index,
      name: test.name,
      input: test.input ?? null,
      expected: test.expected,
      hidden: test.hidden ?? false
    }))
  })
}

main()
  .catch(error => {
    console.error('[seed] failed', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
