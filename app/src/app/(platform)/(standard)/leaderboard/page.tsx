import { HydrateClient, api } from '~/trpc/server'
import LeaderboardTable from '~/features/platform/leaderboard/LeaderboardTable'
import styles from './styles.module.scss'

export const metadata = { title: 'Лидерборд — CodeRoster' }
export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const initial = await api.leaderboard.global({ window: 'allTime', language: 'all' })

  return (
    <HydrateClient>
      <section className={styles.page}>
        <header className={styles.page__hero}>
          <span className={styles.page__eyebrow}>Сообщество</span>
          <h1 className={styles.page__title}>Лидерборд</h1>
          <p className={styles.page__copy}>
            Глобальный топ по XP и решённым задачам. Переключи окно или язык, чтобы увидеть лидеров
            за неделю или среди питонистов.
          </p>
        </header>
        <LeaderboardTable initial={initial} />
      </section>
    </HydrateClient>
  )
}
