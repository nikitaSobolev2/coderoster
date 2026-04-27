import { redirect } from 'next/navigation'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { HydrateClient, api } from '~/trpc/server'
import SettingsTabs from '~/features/platform/settings/SettingsTabs'
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
          <h1 className={styles.page__title}>Настройки</h1>
          <p className={styles.page__copy}>
            Профиль, аккаунт, соцсети и тема. Всё, что показывается другим, и то, что только для
            тебя.
          </p>
        </header>
        <SettingsTabs initial={initial} />
      </section>
    </HydrateClient>
  )
}
