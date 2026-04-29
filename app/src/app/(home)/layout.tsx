import LiveChatHomeRoot from '~/features/livechat/home/LiveChatHomeRoot'

import HomeParallaxGrid from '~/features/home/components/common/HomeParallaxGrid'

import { HomeShell } from './HomeShell'

export default function HomeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <LiveChatHomeRoot>
      <HomeShell>
        <HomeParallaxGrid />
        {children}
      </HomeShell>
    </LiveChatHomeRoot>
  )
}
