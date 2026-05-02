'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ComponentPropsWithoutRef
} from 'react'

import LiveChatPanel from '~/features/livechat/components/LiveChatPanel'
import { useLiveChatHome } from '~/features/livechat/home/livechatHome.context'

import styles from '../livechat.module.scss'

const STORAGE_KEY = 'coderoster.livechat.homeFrame.v1'

export interface LiveChatFrameRect {
  left: number
  top: number
  width: number
  height: number
}

const MIN_W = 280
const MAX_W = 560
const MIN_H = 200
/** Matches clampPosition edge inset — keeps panel fully inside viewport when height is maxed. */
const FRAME_MARGIN_PX = 12

function headerOffsetPx(): number {
  if (typeof window === 'undefined') return 76
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-height').trim()
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) ? n : 76
}

function maxHeightPx(): number {
  if (typeof window === 'undefined') return 876
  return Math.max(MIN_H, window.innerHeight - FRAME_MARGIN_PX * 2)
}

function defaultHeightPx(): number {
  return typeof window !== 'undefined' ? Math.min(window.innerHeight, 400) : 400
}

function defaultWidthPx(): number {
  return typeof window !== 'undefined' ? Math.min(380, window.innerWidth - 48) : 380
}

function clampSize(width: number, height: number): { width: number; height: number } {
  const maxH = maxHeightPx()
  return {
    width: Math.min(MAX_W, Math.max(MIN_W, width)),
    height: Math.min(maxH, Math.max(MIN_H, height))
  }
}

function clampPosition(rect: LiveChatFrameRect): LiveChatFrameRect {
  if (typeof window === 'undefined') return rect
  const vw = window.innerWidth
  const vh = window.innerHeight
  const { width, height } = clampSize(rect.width, rect.height)
  const m = FRAME_MARGIN_PX
  const left = Math.min(Math.max(m, rect.left), vw - width - m)
  const maxTop = Math.max(m, vh - height - m)
  const top = Math.min(Math.max(m, rect.top), maxTop)
  return { left, top, width, height }
}

function defaultCenteredFrame(): LiveChatFrameRect {
  const header = headerOffsetPx()
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const width = defaultWidthPx()
  const height = defaultHeightPx()
  const left = Math.round(Math.max(FRAME_MARGIN_PX, (vw - width) / 2))
  const top = Math.round(Math.max(header + 8, (vh - height) / 2))
  return clampPosition({ left, top, width, height })
}

function parseStored(raw: string | null): LiveChatFrameRect | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as Partial<LiveChatFrameRect>
    if (
      typeof v.left !== 'number' ||
      typeof v.top !== 'number' ||
      typeof v.width !== 'number' ||
      typeof v.height !== 'number'
    ) {
      return null
    }
    return clampPosition({
      left: v.left,
      top: v.top,
      width: v.width,
      height: v.height
    })
  } catch {
    return null
  }
}

export default function LiveChatFloatingShell() {
  const liveChatHome = useLiveChatHome()
  const shellRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<LiveChatFrameRect | null>(null)
  const dragRef = useRef<{
    pointerId: number
    originX: number
    originY: number
    startLeft: number
    startTop: number
  } | null>(null)

  const [frame, setFrame] = useState<LiveChatFrameRect | null>(null)

  useLayoutEffect(() => {
    const stored = parseStored(
      typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    )
    setFrame(stored ?? defaultCenteredFrame())
  }, [])

  useEffect(() => {
    frameRef.current = frame
  }, [frame])

  useEffect(() => {
    if (!frame) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(frame))
    } catch {
      /* noop */
    }
  }, [frame])

  useEffect(() => {
    const el = shellRef.current
    if (!el || !frame) return

    const ro = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width < MIN_W || height < MIN_H) return

      setFrame(prev => {
        if (!prev) return prev
        const rounded = { width: Math.round(width), height: Math.round(height) }
        if (rounded.width === prev.width && rounded.height === prev.height) return prev
        const sized = clampSize(rounded.width, rounded.height)
        return clampPosition({ ...prev, width: sized.width, height: sized.height })
      })
    })

    ro.observe(el)
    return () => ro.disconnect()
  }, [frame?.width, frame?.height])

  const onPointerDownHeader = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    if (target.closest('button,a,input,[role="button"]')) return

    const f = frameRef.current
    if (!f) return

    dragRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      startLeft: f.left,
      startTop: f.top
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  const onPointerMoveHeader = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (drag?.pointerId !== event.pointerId) return
    if (!drag) return
    const dx = event.clientX - drag.originX
    const dy = event.clientY - drag.originY
    const { startLeft, startTop } = drag
    setFrame(prev => {
      if (!prev) return prev
      return clampPosition({
        ...prev,
        left: startLeft + dx,
        top: startTop + dy
      })
    })
  }, [])

  const endDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (drag?.pointerId !== event.pointerId) return
    if (!drag) return
    dragRef.current = null
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* noop */
    }
  }, [])

  const headerInteractiveProps: ComponentPropsWithoutRef<'header'> = {
    className: styles.panelHeaderDrag,
    onPointerDown: onPointerDownHeader,
    onPointerMove: onPointerMoveHeader,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onLostPointerCapture: () => {
      dragRef.current = null
    }
  }

  if (!frame) return null

  return (
    <div
      ref={shellRef}
      className={styles.floatingShell}
      data-livechat-cursor-isolate=""
      style={{
        left: frame.left,
        top: frame.top,
        width: frame.width,
        height: frame.height,
        minWidth: MIN_W,
        maxWidth: MAX_W,
        minHeight: MIN_H,
        maxHeight: maxHeightPx()
      }}
    >
      <LiveChatPanel
        variant="floating"
        headerInteractiveProps={headerInteractiveProps}
        onDrawerClose={() => liveChatHome?.setOpen(false)}
      />
    </div>
  )
}
