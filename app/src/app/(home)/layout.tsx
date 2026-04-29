import HomeParallaxGrid from '~/features/home/components/common/HomeParallaxGrid'

import { HomeShell } from './HomeShell'

export default function HomeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <HomeShell>
      <HomeParallaxGrid />
      {children}
    </HomeShell>
  )
}
