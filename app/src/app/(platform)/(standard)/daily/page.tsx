import { withAuth } from '@workos-inc/authkit-nextjs'
import { HydrateClient, api } from '~/trpc/server'
import DailyShell from '~/features/platform/daily/DailyShell'
import styles from './styles.module.scss'

export const metadata = { title: 'Дейлики — CodeRoster' }
export const dynamic = 'force-dynamic'

export default async function DailyPage() {
  const session = await withAuth()
  const today = await api.daily.getToday()

  return (
    <HydrateClient>
      <section className={styles.page}>
        <header className={styles.page__hero}>
          <span className={styles.page__eyebrow}>Практика</span>
          <h1 className={styles.page__title}>Дейлики</h1>
          <p className={styles.page__copy}>
            Три задачи дня — лёгкая, средняя, сложная. Очисти все, и день не сорвётся.
          </p>
        </header>
        <DailyShell
          initialDate={today.date}
          initialTasks={today.tasks}
          initialAttempts={today.attempts.map(attempt => ({
            taskIndex: attempt.taskIndex,
            status: attempt.status,
            solvedAt: attempt.solvedAt
          }))}
          isAuthenticated={Boolean(session.user)}
        />
      </section>
    </HydrateClient>
  )
}
