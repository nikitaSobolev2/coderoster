import { withAuth } from '@workos-inc/authkit-nextjs'
import { HydrateClient, api } from '~/trpc/server'
import WeeklyShell, { type WeeklyAttemptView } from '~/features/platform/weekly/WeeklyShell'
import { pageTitle } from '~/shared/constants/site'
import styles from './styles.module.scss'

export const metadata = { title: pageTitle('Спидраны') }
export const dynamic = 'force-dynamic'

export default async function WeeklyPage() {
  const session = await withAuth()
  const week = await api.weekly.getCurrent()

  return (
    <HydrateClient>
      <section className={styles.page}>
        <header className={styles.page__hero}>
          <span className={styles.page__eyebrow}>Практика</span>
          <h1 className={styles.page__title}>Спидраны недели</h1>
          <p className={styles.page__copy}>
            Пять задач посложнее. Сдавай в любом порядке — обновляются каждый понедельник в 00:00
            UTC.
          </p>
        </header>
        <WeeklyShell
          initialIsoWeek={week.isoWeek}
          initialTasks={week.tasks}
          initialAttempts={week.attempts.map((attempt: WeeklyAttemptView) => ({
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
