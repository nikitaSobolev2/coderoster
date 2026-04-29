'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const LiveChatDock = dynamic(() => import('~/features/livechat/components/LiveChatDock'), {
  ssr: false
})

export default function LiveChatPlacement() {
  const pathname = usePathname()
  const isLearn = pathname.startsWith('/learn')
  return <LiveChatDock variant={isLearn ? 'overlay' : 'rail'} />
}
