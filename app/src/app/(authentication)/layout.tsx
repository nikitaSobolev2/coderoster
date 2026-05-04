import HomeParallaxGrid from '~/features/home/components/common/HomeParallaxGrid'

import styles from '~/features/authentication/authRouteLayout.module.scss'
import { redirectSignedInUserFromMarketingAuthRoutes } from '~/server/auth/marketingAuthRedirects'

export default async function AuthenticationLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  await redirectSignedInUserFromMarketingAuthRoutes()

  return (
    <div className={styles.authRouteRoot}>
      <HomeParallaxGrid />
      {children}
    </div>
  )
}
