'use client'

import { Skeleton } from '@mantine/core'

import styles from '~/features/authentication/components/authChrome.module.scss'

/** Placeholder OAuth icon tiles while `/api/auth/providers` loads (login email step). */
export function OAuthIconRowSkeleton({ placeholders = 3 }: Readonly<{ placeholders?: number }>) {
  return (
    <div
      className={styles.oauthRow}
      role="status"
      aria-live="polite"
      aria-label="Загрузка способов входа"
    >
      {Array.from({ length: placeholders }, (_, index) => (
        <Skeleton key={index} height={48} w={48} radius="sm" />
      ))}
    </div>
  )
}

/** Placeholder for hosted AuthKit / OAuth CTA while hosted entry path is resolved. */
export function HostedAuthKitButtonSkeleton() {
  return (
    <Skeleton
      height={48}
      radius="md"
      style={{ width: '100%' }}
      role="status"
      aria-live="polite"
      aria-label="Загрузка кнопки входа через AuthKit"
    />
  )
}
