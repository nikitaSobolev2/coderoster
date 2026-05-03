import HomeParallaxGrid from '~/features/home/components/common/HomeParallaxGrid'

import styles from '~/features/authentication/authRouteLayout.module.scss'

export default function AuthenticationLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={styles.authRouteRoot}>
      <HomeParallaxGrid />
      {children}
    </div>
  )
}
