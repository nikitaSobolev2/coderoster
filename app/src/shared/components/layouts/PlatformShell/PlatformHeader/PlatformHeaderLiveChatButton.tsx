'use client'

import { useMediaQuery } from '@mantine/hooks'

import HomeLiveChatHeaderButton from '~/features/livechat/home/HomeLiveChatHeaderButton'
import { useLiveChatPlatform } from '~/features/livechat/platform/livechatPlatform.context'

/** Mobile-only: opens fullscreen platform chat drawer (`LiveChatDock`). Desktop uses right-edge rail everywhere (including `/learn`). */
export default function PlatformHeaderLiveChatButton() {
  const platform = useLiveChatPlatform()
  const isMobile = useMediaQuery('(max-width: 768px)')
  if (!isMobile || !platform) return null

  return <HomeLiveChatHeaderButton onClick={() => platform.toggle()} />
}
