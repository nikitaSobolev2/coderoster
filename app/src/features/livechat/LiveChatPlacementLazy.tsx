'use client'

import dynamic from 'next/dynamic'

const LiveChatPlacement = dynamic(() => import('./LiveChatPlacement'), {
  ssr: false
})

export default function LiveChatPlacementLazy() {
  return <LiveChatPlacement />
}
