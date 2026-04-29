'use client'

import type { RefObject } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { api } from '~/trpc/react'
import { LIVECHAT_PAGE_SIZE } from '~/shared/constants/livechatLimits'
import {
  toLivechatFeedMessage,
  type LivechatFeedMessage
} from '~/features/livechat/model/livechatFeedMessage'

/** Bottom band for sticky auto-scroll tail. */
const STICK_BOTTOM_PX = 140
/** Load older batches when scrolled near top. */
const LOAD_OLDER_SCROLL_TOP_PX = 160

export interface UseLivechatFeedResult {
  messages: LivechatFeedMessage[]
  listQuery: ReturnType<typeof api.livechat.listMessages.useQuery>
  loadingOlder: boolean
  hasMoreOlder: boolean
  fetchOlder: () => Promise<void>
  appendIncomingStream: (incoming: LivechatFeedMessage) => void
  /** Mantine `ScrollArea.onScrollPositionChange`; keeps sticky-bottom + prefetch older rows. */
  onViewportScrollChange: (position: { x: number; y: number }) => void
  isNearBottomRef: RefObject<boolean | null>
  prependBusyRef: RefObject<boolean>
}

/**
 * Snapshot = last {@link LIVECHAT_PAGE_SIZE} messages per server.
 * Prepends older pages on upward scroll until refetched (invalidate resets like before).
 */
export function useLivechatFeed(
  viewportRef: RefObject<HTMLDivElement | null>
): UseLivechatFeedResult {
  const utils = api.useUtils()
  const listQuery = api.livechat.listMessages.useQuery(
    { cursorOlderId: null, limit: LIVECHAT_PAGE_SIZE },
    { staleTime: 15_000 }
  )

  const [messages, setMessages] = useState<LivechatFeedMessage[]>([])
  const nextOlderCursorRef = useRef<string | null>(null)
  const [cursorForUi, setCursorForUi] = useState<string | null>(null)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const prependBusyRef = useRef(false)
  const isNearBottomRef = useRef<boolean>(true)
  const prevScrollYRef = useRef<number | null>(null)

  const snapshotRows = listQuery.data?.items
  useEffect(() => {
    if (!listQuery.isFetched) return
    const rows = snapshotRows ?? []
    setMessages(rows.map(row => toLivechatFeedMessage(row)))
    const nc = listQuery.data?.nextCursorOlder ?? null
    nextOlderCursorRef.current = nc
    setCursorForUi(nc)
  }, [snapshotRows, listQuery.data?.nextCursorOlder, listQuery.isFetched])

  const fetchOlder = useCallback(async () => {
    const cursor = nextOlderCursorRef.current
    if (cursor === null || loadingOlder) return
    const viewport = viewportRef.current
    setLoadingOlder(true)
    prependBusyRef.current = true
    const prevScrollHeight = viewport?.scrollHeight ?? 0
    const prevScrollTop = viewport?.scrollTop ?? 0

    try {
      const res = await utils.client.livechat.listMessages.query({
        cursorOlderId: cursor,
        limit: LIVECHAT_PAGE_SIZE
      })
      const batch = res.items.map(row => toLivechatFeedMessage(row))
      nextOlderCursorRef.current = res.nextCursorOlder
      setCursorForUi(res.nextCursorOlder)
      setMessages(previous => [...batch, ...previous])
      requestAnimationFrame(() => {
        const el = viewportRef.current
        if (el) {
          el.scrollTop = prevScrollTop + (el.scrollHeight - prevScrollHeight)
        }
        prependBusyRef.current = false
      })
    } catch {
      prependBusyRef.current = false
    } finally {
      setLoadingOlder(false)
    }
  }, [loadingOlder, utils.client.livechat.listMessages, viewportRef])

  const appendIncomingStream = useCallback((incoming: LivechatFeedMessage) => {
    setMessages(previous => {
      if (previous.some(message => message.id === incoming.id)) return previous
      return [...previous, incoming]
    })
  }, [])

  const onViewportScrollChange = useCallback(
    ({ y }: { x: number; y: number }) => {
      const viewport = viewportRef.current
      if (viewport) {
        const viewportHeight = viewport.clientHeight
        const threshold = Math.max(STICK_BOTTOM_PX, viewportHeight * 0.12)
        isNearBottomRef.current =
          viewport.scrollHeight - viewportHeight - y <= threshold
      }
      const prev = prevScrollYRef.current
      prevScrollYRef.current = y
      const crossedIntoTopPrefetchBand =
        prev !== null &&
        prev > LOAD_OLDER_SCROLL_TOP_PX &&
        y <= LOAD_OLDER_SCROLL_TOP_PX
      if (crossedIntoTopPrefetchBand && nextOlderCursorRef.current !== null && !loadingOlder) {
        void fetchOlder()
      }
    },
    [fetchOlder, loadingOlder, viewportRef]
  )

  return {
    messages,
    listQuery,
    loadingOlder,
    hasMoreOlder: cursorForUi !== null,
    fetchOlder,
    appendIncomingStream,
    onViewportScrollChange,
    isNearBottomRef,
    prependBusyRef
  }
}
