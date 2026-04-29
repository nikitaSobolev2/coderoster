'use client'

import dynamic from 'next/dynamic'

const LiveChatDock = dynamic(() => import('~/features/livechat/components/LiveChatDock'), {
  ssr: false
})

export default function LiveChatPlacement() {
  return <LiveChatDock />
}
