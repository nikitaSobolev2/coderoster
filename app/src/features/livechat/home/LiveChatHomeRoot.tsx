'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Drawer } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

import LiveChatPanel from '~/features/livechat/components/LiveChatPanel'
import LiveChatFloatingShell from '~/features/livechat/home/LiveChatFloatingShell'
import { LIVECHAT_HOME_DRAWER_Z_INDEX } from '~/features/livechat/livechatLayers'
import { LiveChatHomeProvider } from '~/features/livechat/home/livechatHome.context'

import styles from '../livechat.module.scss'

export interface Props {
  children: ReactNode
}

export default function LiveChatHomeRoot({ children }: Props) {
  const [open, setOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')

  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle: () => setOpen(current => !current)
    }),
    [open]
  )

  return (
    <LiveChatHomeProvider value={value}>
      {children}
      {isMobile ? (
        <Drawer
          opened={open}
          onClose={() => setOpen(false)}
          position="bottom"
          size="100%"
          padding={0}
          withCloseButton={false}
          zIndex={LIVECHAT_HOME_DRAWER_Z_INDEX}
          classNames={{
            inner: styles.homeChatDrawerInner,
            content: styles.homeChatDrawerContent,
            header: styles.homeChatDrawerHeaderHidden,
            body: styles.homeChatDrawerBody
          }}
        >
          <div
            className={styles.homeChatCursorSuspendWrap}
            data-livechat-mobile-sheet=""
            data-livechat-cursor-isolate=""
          >
            <LiveChatPanel variant="floating" onDrawerClose={() => setOpen(false)} />
          </div>
        </Drawer>
      ) : open ? (
        <LiveChatFloatingShell />
      ) : null}
    </LiveChatHomeProvider>
  )
}
