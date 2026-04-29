import { withAuth } from '@workos-inc/authkit-nextjs'
import { HydrateClient, api } from '~/trpc/server'
import AchievementsPanel from '~/features/platform/achievements/AchievementsPanel'
import type { AchievementProgress } from '~/server/api/routers/achievement'
import type { EarnedAchievement } from '~/server/repositories/types'
import { pageTitle } from '~/shared/constants/site'
import styles from './styles.module.scss'

export const metadata = { title: pageTitle('Достижения') }
export const dynamic = 'force-dynamic'

export default async function AchievementsPage() {
  const session = await withAuth()
  const isAuthenticated = Boolean(session.user)
  let initial: AchievementProgress[] = []
  if (isAuthenticated) {
    initial = await api.achievement.listMine()
  } else {
    const all = await api.achievement.listAll()
    initial = all.map((item: EarnedAchievement) => ({
      ...item,
      currentN: 0,
      goal: 1,
      active: false
    }))
  }

  return (
    <HydrateClient>
      <section className={styles.page}>
        <header className={styles.page__hero}>
          <span className={styles.page__eyebrow}>Прогресс</span>
          <h1 className={styles.page__title}>Достижения</h1>
          <p className={styles.page__copy}>
            Каждая ачивка раскрывается автоматически — за уроки, серии, скоростные решения и редкие
            маршруты.
          </p>
        </header>
        <AchievementsPanel initial={initial} isAuthenticated={isAuthenticated} />
      </section>
    </HydrateClient>
  )
}
