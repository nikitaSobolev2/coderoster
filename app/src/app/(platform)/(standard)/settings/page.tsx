import { redirect } from 'next/navigation'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { HydrateClient, api } from '~/trpc/server'
import SettingsLayout from '~/features/platform/settings/SettingsLayout'
import styles from './styles.module.scss'

export const metadata = { title: 'Настройки — CodeRoster' }

export default async function SettingsPage() {
  const session = await withAuth()
  if (!session.user) redirect('/login')

  const initial = await api.settings.getMine()

  return (
    <HydrateClient>
      <section className={styles.page}>
        <header className={styles.page__hero}>
          <span className={styles.page__eyebrow}>Аккаунт</span>
          <h1 className={styles.page__title}>Настройки</h1>
          <p className={styles.page__copy}>
            Управляй профилем, безопасностью и тем, как платформа выглядит лично для тебя.
          </p>
        </header>
        <SettingsLayout initial={initial} />
      </section>
    </HydrateClient>
  )
}
