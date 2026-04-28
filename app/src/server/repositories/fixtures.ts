import type {
  Achievement,
  AuthorRef,
  CourseDetail,
  CourseSummary,
  EarnedAchievement,
  EnrollmentState,
  LessonDetail,
  ProfileCommentEntry,
  PublicProfile,
  UserSettings
} from './types'

const NOW = new Date('2026-04-26T12:00:00Z')

const author = (over: Partial<AuthorRef> = {}): AuthorRef => ({
  id: over.id ?? 'author-1',
  username: over.username ?? 'codenikita',
  displayName: over.displayName ?? 'Никита Соболев',
  avatarUrl: over.avatarUrl ?? null
})

const PYTHON_BASICS: CourseDetail = {
  id: 'course-py-basics',
  slug: 'python-basics',
  title: 'Python с нуля',
  description: 'Поставим первую программу, переменные, ветвления и циклы — на реальных задачах.',
  longDescription:
    'Курс ведёт от установки интерпретатора до уверенного решения базовых задач. Каждый урок заканчивается интерактивной задачей с проверкой.',
  language: 'python',
  difficulty: 'beginner',
  durationHours: 12,
  xpReward: 1200,
  enrollmentCount: 1842,
  thumbnail: null,
  tags: ['основы', 'синтаксис', 'практика'],
  author: author(),
  category: { id: 'cat-py', slug: 'python', title: 'Python', iconKey: 'python' },
  learningOutcomes: [
    'Запускать программы на Python локально и в браузере',
    'Работать с переменными, числами, строками и списками',
    'Писать ветвления, циклы и функции',
    'Решать алгоритмические задачки уровня junior'
  ],
  modules: [
    {
      id: 'mod-py-1',
      title: 'Старт',
      description: 'Установка, запуск, первая программа.',
      lessons: [
        { id: 'l-py-1-1', title: 'Hello, World', kind: 'task', estimatedMinutes: 10 },
        { id: 'l-py-1-2', title: 'Переменные', kind: 'task', estimatedMinutes: 15 },
        { id: 'l-py-1-3', title: 'Числа и строки', kind: 'task', estimatedMinutes: 20 }
      ]
    },
    {
      id: 'mod-py-2',
      title: 'Ветвления и циклы',
      description: 'if / else, while, for и неизбежные баги.',
      lessons: [
        { id: 'l-py-2-1', title: 'Условные выражения', kind: 'task', estimatedMinutes: 25 },
        { id: 'l-py-2-2', title: 'Цикл while', kind: 'task', estimatedMinutes: 25 },
        { id: 'l-py-2-3', title: 'Цикл for', kind: 'task', estimatedMinutes: 25 }
      ]
    },
    {
      id: 'mod-py-3',
      title: 'Функции',
      description: 'Параметры, возврат, область видимости.',
      lessons: [
        { id: 'l-py-3-1', title: 'Объявление функции', kind: 'task', estimatedMinutes: 20 },
        { id: 'l-py-3-2', title: 'Аргументы по умолчанию', kind: 'task', estimatedMinutes: 20 }
      ]
    }
  ]
}

const PHP_API: CourseDetail = {
  id: 'course-php-api',
  slug: 'php-api-fundamentals',
  title: 'PHP: серверный API',
  description: 'Маршрутизация, JSON, валидация, БД — без фреймворков.',
  longDescription:
    'Поднимем минимальный API на PHP с нуля: маршрутизация, валидация запросов, работа с PDO, аутентификация, тесты.',
  language: 'php',
  difficulty: 'intermediate',
  durationHours: 18,
  xpReward: 2200,
  enrollmentCount: 612,
  thumbnail: null,
  tags: ['backend', 'http', 'pdo'],
  author: author({ id: 'author-2', username: 'php_pro', displayName: 'Мария Лазарева' }),
  category: { id: 'cat-php', slug: 'php', title: 'PHP', iconKey: 'php' },
  learningOutcomes: [
    'Понимать жизненный цикл HTTP-запроса в PHP',
    'Писать роутер без фреймворка',
    'Работать с PDO и параметризованными запросами',
    'Валидировать входные данные и возвращать корректные коды ответа'
  ],
  modules: [
    {
      id: 'mod-php-1',
      title: 'HTTP и маршрутизация',
      description: 'Запрос, ответ, заголовки.',
      lessons: [
        { id: 'l-php-1-1', title: 'Hello, HTTP', kind: 'task', estimatedMinutes: 15 },
        { id: 'l-php-1-2', title: 'Простой роутер', kind: 'task', estimatedMinutes: 30 }
      ]
    },
    {
      id: 'mod-php-2',
      title: 'JSON и валидация',
      description: 'Парсим, валидируем, отвечаем.',
      lessons: [
        { id: 'l-php-2-1', title: 'JSON request body', kind: 'task', estimatedMinutes: 25 },
        { id: 'l-php-2-2', title: 'Минимальный валидатор', kind: 'task', estimatedMinutes: 35 }
      ]
    }
  ]
}

const ALGORITHMS: CourseDetail = {
  id: 'course-algo-1',
  slug: 'algorithms-introduction',
  title: 'Алгоритмы для собеседований',
  description: 'Сложность, массивы, строки, два указателя, хэш-таблицы.',
  longDescription:
    'Базовый набор для разговора на интервью: оценим сложность, разберём типовые шаблоны на массивах и строках, потренируемся.',
  language: 'python',
  difficulty: 'advanced',
  durationHours: 24,
  xpReward: 3000,
  enrollmentCount: 2145,
  thumbnail: null,
  tags: ['собеседование', 'алгоритмы', 'big-o'],
  author: author({ id: 'author-3', username: 'algo_dasha', displayName: 'Даша Кравцова' }),
  category: { id: 'cat-algo', slug: 'algorithms', title: 'Алгоритмы', iconKey: 'algorithm' },
  learningOutcomes: [
    'Оценивать сложность по времени и памяти',
    'Применять «два указателя» на массивах и строках',
    'Использовать хэш-таблицы для O(1) поиска',
    'Решать задачи уровня LeetCode Easy/Medium'
  ],
  modules: [
    {
      id: 'mod-algo-1',
      title: 'Сложность и массивы',
      description: 'Big-O, два указателя, скользящее окно.',
      lessons: [
        { id: 'l-algo-1-1', title: 'Сумма двух чисел', kind: 'task', estimatedMinutes: 20 },
        { id: 'l-algo-1-2', title: 'Скользящее окно', kind: 'task', estimatedMinutes: 30 }
      ]
    }
  ]
}

const ALL_COURSES: CourseDetail[] = [PYTHON_BASICS, PHP_API, ALGORITHMS]

export function getFakeCourses(): CourseDetail[] {
  return ALL_COURSES
}

export function getFakeCourseSummaries(): CourseSummary[] {
  return ALL_COURSES.map(stripCourseDetail)
}

function stripCourseDetail(detail: CourseDetail): CourseSummary {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { longDescription, learningOutcomes, modules, ...summary } = detail
  return summary
}

export function findFakeCourseBySlug(slug: string): CourseDetail | null {
  return ALL_COURSES.find(course => course.slug === slug) ?? null
}

const LESSON_BODIES: Record<string, Pick<LessonDetail, 'body' | 'starterCode' | 'language'>> = {
  'l-py-1-1': {
    language: 'python',
    starterCode: '# Выведи строку Hello, World на экран\n',
    body:
      '## Привет, мир\n\nКлассика: первая программа выводит строку `Hello, World` в консоль.\n\n' +
      '**Задача:** используй `print()` чтобы вывести именно `Hello, World` (без точки в конце).'
  },
  'l-py-1-2': {
    language: 'python',
    starterCode:
      '# Создай переменную name со значением "CodeRoster" и выведи её через print\nname = ""\n',
    body:
      '## Переменные\n\nПеременная — это имя для значения. В Python тип определяется по присваиванию.\n\n' +
      '**Задача:** присвой переменной `name` строку `"CodeRoster"` и выведи её.'
  },
  'l-py-1-3': {
    language: 'python',
    starterCode: '# Сложи числа a и b и выведи результат\na = 2\nb = 3\n',
    body: '## Числа и строки\n\nСложи `a` и `b`, выведи число.'
  },
  'l-py-2-1': {
    language: 'python',
    starterCode: '# Выведи "even" если n чётное, иначе "odd"\nn = 7\n',
    body: '## Условные выражения\n\nИспользуй `if`/`else`.'
  },
  'l-py-2-2': {
    language: 'python',
    starterCode: '# Выведи числа от 1 до 5 через while\n',
    body: '## Цикл while\n\nИтерируй пока условие истинно.'
  },
  'l-py-2-3': {
    language: 'python',
    starterCode: '# Сумма от 1 до n включительно через for\nn = 5\n',
    body: '## Цикл for\n\nИспользуй `range`.'
  },
  'l-py-3-1': {
    language: 'python',
    starterCode: 'def greet(name):\n    pass\n\nprint(greet("CodeRoster"))\n',
    body: '## Объявление функции\n\nВерни строку `Hello, <name>`.'
  },
  'l-py-3-2': {
    language: 'python',
    starterCode: 'def greet(name="мир"):\n    pass\n\nprint(greet())\n',
    body: '## Аргументы по умолчанию\n\nЕсли имя не передали — используй `мир`.'
  },
  'l-php-1-1': {
    language: 'php',
    starterCode: '<?php\n// Выведи Hello, HTTP\n',
    body: '## Hello, HTTP\n\nИспользуй `echo`.'
  },
  'l-php-1-2': {
    language: 'php',
    starterCode: '<?php\n// Маршрутизатор: GET /ping → pong\n',
    body: '## Простой роутер\n\nРазбираем `$_SERVER[REQUEST_METHOD]` и `REQUEST_URI`.'
  },
  'l-php-2-1': {
    language: 'php',
    starterCode: "<?php\n$payload = file_get_contents('php://input');\n",
    body: '## JSON request body\n\nДекодируй и выведи поле `name`.'
  },
  'l-php-2-2': {
    language: 'php',
    starterCode: '<?php\n// Минимальный валидатор\n',
    body: '## Минимальный валидатор\n\nПроверяй наличие обязательных ключей.'
  },
  'l-algo-1-1': {
    language: 'python',
    starterCode:
      'def two_sum(nums, target):\n    # верни индексы двух чисел, дающих target\n    pass\n\nprint(two_sum([2,7,11,15], 9))\n',
    body: '## Two Sum\n\nКлассика на хэш-таблицу.'
  },
  'l-algo-1-2': {
    language: 'python',
    starterCode:
      'def longest_unique(s):\n    # длина самой длинной подстроки без повторов\n    pass\n',
    body: '## Скользящее окно\n\nПоддерживай множество символов.'
  }
}

export function getFakeLessonDetail(courseSlug: string, lessonId: string): LessonDetail | null {
  const course = findFakeCourseBySlug(courseSlug)
  if (!course) return null

  const flat = course.modules.flatMap(module => module.lessons.map(lesson => ({ module, lesson })))
  const index = flat.findIndex(item => item.lesson.id === lessonId)
  if (index < 0) return null

  const current = flat[index]!
  const previous = index > 0 ? flat[index - 1]!.lesson.id : null
  const next = index < flat.length - 1 ? flat[index + 1]!.lesson.id : null
  const body = LESSON_BODIES[lessonId] ?? {
    language: course.language,
    starterCode: '# starter\n',
    body: '## ' + current.lesson.title
  }

  return {
    ...current.lesson,
    courseSlug: course.slug,
    courseTitle: course.title,
    moduleId: current.module.id,
    moduleTitle: current.module.title,
    order: index + 1,
    body: body.body,
    starterCode: body.starterCode,
    language: body.language,
    tests: [
      { name: 'Базовый прогон', hidden: false },
      { name: 'Скрытый кейс', hidden: true }
    ],
    previousLessonId: previous,
    nextLessonId: next
  }
}

const FAKE_ENROLLMENTS = new Map<string, EnrollmentState>([
  [
    'python-basics',
    {
      courseSlug: 'python-basics',
      status: 'active',
      startedAt: new Date(NOW.getTime() - 14 * 86_400_000),
      finishedAt: null,
      progressPercent: 38,
      completedLessonIds: ['l-py-1-1', 'l-py-1-2', 'l-py-1-3'],
      currentLessonId: 'l-py-2-1'
    }
  ],
  [
    'php-api-fundamentals',
    {
      courseSlug: 'php-api-fundamentals',
      status: 'finished',
      startedAt: new Date(NOW.getTime() - 90 * 86_400_000),
      finishedAt: new Date(NOW.getTime() - 30 * 86_400_000),
      progressPercent: 100,
      completedLessonIds: ['l-php-1-1', 'l-php-1-2', 'l-php-2-1', 'l-php-2-2'],
      currentLessonId: null
    }
  ]
])

export function getFakeEnrollment(courseSlug: string): EnrollmentState | null {
  return FAKE_ENROLLMENTS.get(courseSlug) ?? null
}

export function listFakeEnrollments(): EnrollmentState[] {
  return [...FAKE_ENROLLMENTS.values()]
}

export function setFakeEnrollment(state: EnrollmentState) {
  FAKE_ENROLLMENTS.set(state.courseSlug, state)
}

const FAKE_PROFILE: PublicProfile = {
  id: 'user-1',
  username: 'codenikita',
  displayName: 'Никита Соболев',
  avatarUrl: null,
  bio: 'Учусь, ломаю, повторяю. Backend по любви, фронтенд по необходимости.',
  joinedAt: new Date('2026-01-12T00:00:00Z'),
  socials: {
    github: 'https://github.com/nikitaSobolev2',
    linkedin: null,
    x: null,
    website: 'https://t.me/sobolevNikitaWD'
  },
  stats: {
    totalXp: 2480,
    level: 6,
    xpIntoLevel: 230,
    xpForNextLevel: 600,
    streakDays: 11,
    coursesCompleted: 1,
    coursesActive: 1,
    tasksSolved: 38
  },
  isOwner: false
}

export function getFakeProfile(username: string): PublicProfile | null {
  if (username.toLowerCase() === FAKE_PROFILE.username.toLowerCase()) return FAKE_PROFILE
  return null
}

export const FAKE_USER_SETTINGS: UserSettings = {
  displayName: FAKE_PROFILE.displayName,
  username: FAKE_PROFILE.username,
  email: 'nikita@coderoster.dev',
  bio: FAKE_PROFILE.bio,
  avatarUrl: FAKE_PROFILE.avatarUrl,
  socials: FAKE_PROFILE.socials,
  appearance: { colorScheme: 'dark' },
  joinedAt: FAKE_PROFILE.joinedAt,
  role: 'learner',
  deletionRequestedAt: null
}

const ACHIEVEMENT_LIST: Achievement[] = [
  {
    id: 'first-steps',
    name: 'Первые шаги',
    description: 'Заверши первый урок',
    icon: 'shoe-prints',
    imageUrl: null,
    category: 'progression',
    rarity: 'common',
    hidden: false
  },
  {
    id: 'on-fire',
    name: 'В огне',
    description: 'Серия 7 дней подряд',
    icon: 'fire',
    imageUrl: null,
    category: 'streak',
    rarity: 'rare',
    hidden: false
  },
  {
    id: 'all-clear',
    name: 'Чистый зачёт',
    description: 'Заверши все задания одного курса',
    icon: 'circle-check',
    imageUrl: null,
    category: 'completionist',
    rarity: 'epic',
    hidden: false
  },
  {
    id: 'speed-coder',
    name: 'Скорострел',
    description: 'Сдай задание быстрее лимита',
    icon: 'bolt',
    imageUrl: null,
    category: 'speed',
    rarity: 'rare',
    hidden: false
  },
  {
    id: 'night-owl',
    name: '???',
    description: 'Скрытое условие',
    icon: 'moon',
    imageUrl: null,
    category: 'hidden',
    rarity: 'legendary',
    hidden: true
  }
]

export function getFakeAchievements(username: string): EarnedAchievement[] {
  const earned = new Set(['first-steps', 'on-fire', 'all-clear'])
  return ACHIEVEMENT_LIST.map(a => ({
    ...a,
    earned: earned.has(a.id),
    earnedAt: earned.has(a.id) ? new Date(NOW.getTime() - 5 * 86_400_000) : null
  })).filter(() => username.length > 0)
}

export function getFakeActivity(year: number) {
  const cells: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] = []
  const start = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year, 11, 31))
  for (let date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
    const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000)
    const seed = (dayOfYear * 9301 + 49297) % 233_280
    const random = seed / 233_280
    const count = random < 0.55 ? 0 : Math.floor(random * 8)
    cells.push({
      date: date.toISOString().slice(0, 10),
      count,
      level: pickLevel(count)
    })
  }
  return cells
}

function pickLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (count <= 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

const FAKE_COMMENTS: ProfileCommentEntry[] = [
  {
    id: 'c1',
    authorUsername: 'php_pro',
    authorDisplayName: 'Мария Лазарева',
    authorAvatarUrl: null,
    body: 'Спасибо за PR в core. Сделай ещё пару, и закроем issue окончательно.',
    createdAt: new Date(NOW.getTime() - 2 * 86_400_000)
  },
  {
    id: 'c2',
    authorUsername: 'algo_dasha',
    authorDisplayName: 'Даша Кравцова',
    authorAvatarUrl: null,
    body: 'Огонь решение по two-sum, можно даже без хэша через сортировку?',
    createdAt: new Date(NOW.getTime() - 5 * 86_400_000)
  },
  {
    id: 'c3',
    authorUsername: 'guest42',
    authorDisplayName: 'Гость',
    authorAvatarUrl: null,
    body: 'Привет! Видел твой профиль на лидерборде, держи темп.',
    createdAt: new Date(NOW.getTime() - 12 * 86_400_000)
  }
]

export function getFakeComments(): ProfileCommentEntry[] {
  return FAKE_COMMENTS
}
