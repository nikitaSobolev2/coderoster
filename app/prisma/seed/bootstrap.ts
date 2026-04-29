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
    { key: 'livechat_guest_policy', value: { allowGuests: true } }
  ]
  for (const row of defaults) {
    await prisma.appSetting.deleteMany({ where: { key: row.key } })
    await prisma.appSetting.create({ data: { key: row.key, value: row.value } })
  }
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
