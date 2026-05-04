'use client'

import type { CSSProperties, RefObject } from 'react'
import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import Link from 'next/link'
import { Badge, Menu, UnstyledButton } from '@mantine/core'
import { useVirtualizer } from '@tanstack/react-virtual'

import { LIVECHAT_AUTHOR_MENU_Z_INDEX } from '~/features/livechat/livechatLayers'
import type { LivechatFeedMessage } from '~/features/livechat/model/livechatFeedMessage'
import styles from '../../livechat.module.scss'

/** Initial estimate; wrapping lines corrected via TanStack Virtual `measureElement`. */
const LIVECHAT_ROW_ESTIMATE_PX = 52
const OVERSCAN_ROWS = 14

export interface LiveChatVirtualFeedProps {
  messages: LivechatFeedMessage[]
  viewportRef: RefObject<HTMLDivElement | null>
  feedBootstrapped: boolean
  usernameHex: (token: string) => string
  isNearBottomRef: RefObject<boolean | null>
  prependBusyRef: RefObject<boolean>
}

/**
 * Renders only rows intersecting Mantine ScrollArea viewport ({@link viewportRef}); safe for huge history.
 */
export function LiveChatVirtualFeed({
  messages,
  viewportRef,
  feedBootstrapped,
  usernameHex,
  isNearBottomRef,
  prependBusyRef
}: LiveChatVirtualFeedProps) {
  // TanStack Virtual returns unstable function refs; compiler correctly skips memoizing this subtree.
  // eslint-disable-next-line react-hooks/incompatible-library -- @tanstack/react-virtual useVirtualizer
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => LIVECHAT_ROW_ESTIMATE_PX,
    overscan: OVERSCAN_ROWS
  })

  const tailIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!feedBootstrapped || messages.length === 0) return
    if (prependBusyRef.current) return

    const last = messages.at(-1)
    if (!last) return
    const changed = tailIdRef.current !== last.id
    tailIdRef.current = last.id
    if (!changed) return
    if (!isNearBottomRef.current) return

    const viewport = viewportRef.current
    if (!viewport) return
    requestAnimationFrame(() => {
      viewport.scrollTop = viewport.scrollHeight
    })
  }, [messages, feedBootstrapped, isNearBottomRef, prependBusyRef, viewportRef])

  const railStyle: CSSProperties = {
    height: virtualizer.getTotalSize(),
    width: '100%',
    position: 'relative'
  }

  const items = virtualizer.getVirtualItems()

  return (
    <div className={styles.virtualFeedRail} style={railStyle}>
      {items.map(vRow => {
        const message = messages[vRow.index]
        if (!message) return null

        const transform: CSSProperties = {
          position: 'absolute',
          left: 0,
          width: '100%',
          transform: `translateY(${vRow.start}px)`
        }

        return (
          <div
            key={message.id}
            data-index={vRow.index}
            ref={virtualizer.measureElement}
            className={styles.line}
            style={transform}
          >
            {message.authorPlanBadge ? (
              <span className={styles.planBadge}>
                <Badge variant="outline" size="xs" radius="sm" color="gray">
                  {message.authorPlanBadge}
                </Badge>
              </span>
            ) : null}
            {message.authorKind === 'AUTH' && message.authorProfileUsername ? (
              <Menu
                width={200}
                position="bottom-start"
                shadow="sm"
                zIndex={LIVECHAT_AUTHOR_MENU_Z_INDEX}
                withinPortal
              >
                <Menu.Target>
                  <UnstyledButton
                    className={clsx(styles.author, styles.authorInteractive)}
                    style={{ color: usernameHex(message.usernameColor) }}
                  >
                    {message.authorLabel}
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown data-livechat-cursor-isolate="">
                  <Menu.Item
                    component={Link}
                    href={`/u/${encodeURIComponent(message.authorProfileUsername)}`}
                  >
                    Открыть профиль
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <span className={styles.author} style={{ color: usernameHex(message.usernameColor) }}>
                {message.authorLabel}
              </span>
            )}
            <span className={styles.bodyText}>: {message.body}</span>
          </div>
        )
      })}
    </div>
  )
}
