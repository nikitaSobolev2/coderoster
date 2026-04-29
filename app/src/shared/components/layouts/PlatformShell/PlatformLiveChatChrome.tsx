'use client'

import type { ReactNode } from 'react'

import { LiveChatPlatformProvider } from '~/features/livechat/platform/livechatPlatform.context'

export default function PlatformLiveChatChrome({ children }: { readonly children: ReactNode }) {
  return <LiveChatPlatformProvider>{children}</LiveChatPlatformProvider>
}
