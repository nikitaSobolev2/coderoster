import { withAuth } from '@workos-inc/authkit-nextjs'
import SandboxShell from '~/features/platform/sandbox/SandboxShell'
import { pageTitle } from '~/shared/constants/site'
import styles from './styles.module.scss'

export const metadata = { title: pageTitle('Песочница') }
export const dynamic = 'force-dynamic'

export default async function SandboxPage() {
  const session = await withAuth()
  const isAuthenticated = Boolean(session.user)

  return (
    <section className={styles.page}>
      <header className={styles.page__hero}>
        <span className={styles.page__eyebrow}>Практика</span>
        <h1 className={styles.page__title}>Песочница</h1>
        <p className={styles.page__copy}>
          Запусти любой кусок Python или PHP в защищённом контейнере. Без оценок, без счётчиков —
          только быстрая обратная связь.
        </p>
      </header>
      <SandboxShell isAuthenticated={isAuthenticated} />
    </section>
  )
}
