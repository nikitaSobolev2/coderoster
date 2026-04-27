import Link from 'next/link'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { db } from '~/server/db'
import styles from './styles.module.scss'

/**
 * Public page rendered when a banned user tries to use the app. Tells them
 * how long the ban lasts (if temporary) and where to appeal. We deliberately
 * keep this server-side so guests can't end up in a redirect loop.
 */
export default async function BannedPage() {
  const message = await resolveBanMessage()
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.card__title}>Доступ ограничен</h1>
        <p className={styles.card__body}>{message}</p>
        <p className={styles.card__hint}>
          Если считаешь, что блокировка ошибка — напиши на support@coderoster.dev.
        </p>
        <Link href="/account/logout" className={styles.card__action}>
          Выйти из аккаунта
        </Link>
      </section>
    </main>
  )
}

async function resolveBanMessage(): Promise<string> {
  const session = await withAuth()
  if (!session.user) return 'Этот раздел недоступен.'
  const user = await db.user.findUnique({
    where: { workosUserId: session.user.id },
    select: { bannedUntil: true, banReason: true }
  })
  if (!user?.bannedUntil) return 'Аккаунт временно ограничен в правах.'
  const isPermanent = user.bannedUntil.getFullYear() > 9000
  const reason = user.banReason ? ` Причина: ${user.banReason}` : ''
  if (isPermanent) return `Аккаунт заблокирован без срока.${reason}`
  return `Аккаунт заблокирован до ${user.bannedUntil.toLocaleString('ru-RU')}.${reason}`
}
