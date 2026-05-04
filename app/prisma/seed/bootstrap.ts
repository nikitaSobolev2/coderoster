import { ContentPagePlacement, type Prisma, Role } from '@prisma/client'
import { CONTENT_PAGE_SEEDS } from './contentPages.seed'
import { prisma } from './lib/client'

export async function seedAchievements() {
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
    },
    {
      slug: 'premium-member',
      title: 'Статус Pro',
      description: 'Оформил тариф Про или Pro+',
      category: 'progression',
      rarity: 'rare',
      coverImage: 'star',
      goal: 1
    }
  ]
  for (const item of items) {
    const data = {
      title: item.title,
      description: item.description,
      category: item.category,
      rarity: item.rarity,
      coverImage: item.coverImage,
      hidden: item.hidden ?? false,
      goal: item.goal ?? null
    }
    await prisma.achievement.upsert({
      where: { slug: item.slug },
      update: data,
      create: { slug: item.slug, ...data }
    })
  }
}

export async function seedContentPages() {
  for (const page of CONTENT_PAGE_SEEDS) {
    await prisma.contentPage.deleteMany({ where: { slug: page.slug } })
    await prisma.contentPage.create({
      data: {
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

export async function seedAppSettings() {
  const defaults: { key: string; value: Prisma.InputJsonValue }[] = [
    { key: 'allowed_languages', value: ['python', 'php'] },
    { key: 'livechat_guest_policy', value: { allowGuests: true } },
    { key: 'ai_code_improve', value: { model: 'gpt-4o-mini' } }
  ]
  for (const row of defaults) {
    await prisma.appSetting.deleteMany({ where: { key: row.key } })
    await prisma.appSetting.create({ data: { key: row.key, value: row.value } })
  }
}

export async function seedPlans() {
  const free = await prisma.plan.upsert({
    where: { slug: 'free' },
    update: {
      name: 'Бесплатный',
      shortDescription: 'Старт без оплаты — до трёх активных курсов.',
      marketingMarkdown:
        '**Старт без карты.** Три активных курса параллельно — достаточно, чтобы уверенно войти в ритм обучения.',
      marketingFeatures: [
        { iconKey: 'check', text: 'До 3 активных курсов одновременно' },
        { iconKey: 'star', text: 'Базовый прогресс и достижения' },
        { iconKey: 'shield', text: 'Безопасный старт: без обязательств по оплате' }
      ],
      isBestseller: false,
      tierLevel: 0,
      xpBonusPercent: 0,
      sortOrder: 0,
      isDefaultFree: true,
      maxActiveCourses: 3
    },
    create: {
      slug: 'free',
      name: 'Бесплатный',
      shortDescription: 'Старт без оплаты — до трёх активных курсов.',
      marketingMarkdown:
        '**Старт без карты.** Три активных курса параллельно — достаточно, чтобы уверенно войти в ритм обучения.',
      marketingFeatures: [
        { iconKey: 'check', text: 'До 3 активных курсов одновременно' },
        { iconKey: 'star', text: 'Базовый прогресс и достижения' },
        { iconKey: 'shield', text: 'Безопасный старт: без обязательств по оплате' }
      ],
      isBestseller: false,
      tierLevel: 0,
      xpBonusPercent: 0,
      sortOrder: 0,
      isDefaultFree: true,
      maxActiveCourses: 3
    }
  })
  await prisma.plan.upsert({
    where: { slug: 'pro' },
    update: {
      name: 'Про',
      shortDescription: 'Безлимит курсов, бонус XP, ИИ-разбор кода.',
      marketingMarkdown:
        '**Для тех, кто хочет расти быстрее.** Без лимита курсов, усиленная выдача XP и ИИ-разбор кода по заданиям.',
      marketingFeatures: [
        { iconKey: 'infinity', text: 'Неограниченно активных курсов' },
        { iconKey: 'bolt', text: 'Бонус +25% к опыту (XP)' },
        { iconKey: 'wand', text: 'ИИ-разбор и подсказки по коду в задачах' },
        { iconKey: 'rocket', text: 'Приоритетный доступ к новым материалам' }
      ],
      isBestseller: true,
      tierLevel: 1,
      xpBonusPercent: 25,
      sortOrder: 1,
      isDefaultFree: false,
      maxActiveCourses: null
    },
    create: {
      slug: 'pro',
      name: 'Про',
      shortDescription: 'Безлимит курсов, бонус XP, ИИ-разбор кода.',
      marketingMarkdown:
        '**Для тех, кто хочет расти быстрее.** Без лимита курсов, усиленная выдача XP и ИИ-разбор кода по заданиям.',
      marketingFeatures: [
        { iconKey: 'infinity', text: 'Неограниченно активных курсов' },
        { iconKey: 'bolt', text: 'Бонус +25% к опыту (XP)' },
        { iconKey: 'wand', text: 'ИИ-разбор и подсказки по коду в задачах' },
        { iconKey: 'rocket', text: 'Приоритетный доступ к новым материалам' }
      ],
      isBestseller: true,
      tierLevel: 1,
      xpBonusPercent: 25,
      sortOrder: 1,
      isDefaultFree: false,
      maxActiveCourses: null
    }
  })
  await prisma.plan.upsert({
    where: { slug: 'pro-plus' },
    update: {
      name: 'Pro+',
      shortDescription:
        'Максимум практики: лаборатории уровня Pro+, усиленный бонус XP и расширенный доступ.',
      marketingMarkdown:
        '**Для углублённой траектории.** Всё из Pro, более высокий бонус XP и каталог продвинутых лабораторий с задачами уровня Pro+.',
      marketingFeatures: [
        { iconKey: 'infinity', text: 'Все возможности тарифа Pro' },
        { iconKey: 'bolt', text: 'Бонус +40% к опыту (XP)' },
        { iconKey: 'code', text: 'Лаборатории и курсы с доступом по уровню Pro+' },
        { iconKey: 'star', text: 'Приоритетный доступ к экспериментальным материалам' }
      ],
      isBestseller: false,
      tierLevel: 2,
      xpBonusPercent: 40,
      sortOrder: 2,
      isDefaultFree: false,
      maxActiveCourses: null
    },
    create: {
      slug: 'pro-plus',
      name: 'Pro+',
      shortDescription:
        'Максимум практики: лаборатории уровня Pro+, усиленный бонус XP и расширенный доступ.',
      marketingMarkdown:
        '**Для углублённой траектории.** Всё из Pro, более высокий бонус XP и каталог продвинутых лабораторий с задачами уровня Pro+.',
      marketingFeatures: [
        { iconKey: 'infinity', text: 'Все возможности тарифа Pro' },
        { iconKey: 'bolt', text: 'Бонус +40% к опыту (XP)' },
        { iconKey: 'code', text: 'Лаборатории и курсы с доступом по уровню Pro+' },
        { iconKey: 'star', text: 'Приоритетный доступ к экспериментальным материалам' }
      ],
      isBestseller: false,
      tierLevel: 2,
      xpBonusPercent: 40,
      sortOrder: 2,
      isDefaultFree: false,
      maxActiveCourses: null
    }
  })
  return free
}

export async function backfillUserPlanIds(freePlanId: string) {
  await prisma.user.updateMany({
    where: { planId: null },
    data: { planId: freePlanId }
  })
}

export async function promoteBootstrapAdmin() {
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
