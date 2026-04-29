'use client'

import { useEffect, useRef } from 'react'
import { useMatchMedia } from '~/shared/hooks/useMatchMedia'
import { LIVECHAT_DOM_ISOLATE_SELECTOR } from '~/shared/constants/livechatDom'
import { HOME_DESKTOP_INTERACTION_MQ } from '~/shared/constants/homeDesktopInteractionMediaQuery'
import { useGlobePointerStore } from '~/features/home/components/3d/models/Planet/globePointer.store'
import styles from './styles.module.scss'
import { useCursorStore, type CursorStore } from './cursor.store'

const FOLLOW_LERP = 0.18

function syncHomeCursorSuspendedFromPointer(clientX: number, clientY: number): void {
  const el = document.elementFromPoint(clientX, clientY)
  const isolated = Boolean(el?.closest(LIVECHAT_DOM_ISOLATE_SELECTOR))
  const state = useCursorStore.getState()
  if (isolated !== state.homeCursorSuspended) {
    state.setHomeCursorSuspended(isolated)
  }
}

export default function Cursor() {
  const isDesktopPointer = useMatchMedia(HOME_DESKTOP_INTERACTION_MQ)
  if (!isDesktopPointer) return null
  return <CursorRuntime />
}

function CursorRuntime() {
  const suspended = useCursorStore((state: CursorStore) => state.homeCursorSuspended)
  const cursorRef = useRef<HTMLDivElement>(null)
  const localAnimatedPos = useRef({ x: 0, y: 0 })

  const setPosition = useCursorStore((state: CursorStore) => state.setPosition)
  const styleProps = useCursorStore((state: CursorStore) => state.styleProps)
  const media = useCursorStore((state: CursorStore) => state.media)
  const type = useCursorStore((state: CursorStore) => state.type)

  const pointerOverGlobe = useGlobePointerStore(state => state.pointerOverGlobe)

  useEffect(() => {
    const sync = (event: Event) => {
      const pe = event as PointerEvent
      syncHomeCursorSuspendedFromPointer(pe.clientX, pe.clientY)
    }
    const { pointerX, pointerY } = useCursorStore.getState()
    syncHomeCursorSuspendedFromPointer(pointerX, pointerY)

    document.addEventListener('pointermove', sync, { capture: true })
    document.addEventListener('pointerdown', sync, { capture: true })

    return () => {
      document.removeEventListener('pointermove', sync, { capture: true })
      document.removeEventListener('pointerdown', sync, { capture: true })
    }
  }, [])

  useEffect(() => {
    if (suspended) return undefined

    const initialX = useCursorStore.getState().x
    const initialY = useCursorStore.getState().y
    localAnimatedPos.current = { x: initialX, y: initialY }

    applyTranslate(cursorRef.current, initialX, initialY)

    const handleMouseMove = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY })
    }
    document.addEventListener('mousemove', handleMouseMove)

    let animationFrameId = 0
    const animate = () => {
      const targetX = useCursorStore.getState().x
      const targetY = useCursorStore.getState().y

      localAnimatedPos.current.x += (targetX - localAnimatedPos.current.x) * FOLLOW_LERP
      localAnimatedPos.current.y += (targetY - localAnimatedPos.current.y) * FOLLOW_LERP

      applyTranslate(cursorRef.current, localAnimatedPos.current.x, localAnimatedPos.current.y)
      animationFrameId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [suspended, setPosition])

  useEffect(() => {
    if (suspended) return
    applyStyleProps(cursorRef.current, styleProps)
  }, [styleProps, suspended])

  if (suspended) return null

  return (
    <div
      ref={cursorRef}
      className={styles.cursor}
      data-cursor-type={type}
      {...(type === 'globeHorizontal'
        ? { 'data-globe-hit': pointerOverGlobe ? 'true' : 'false' }
        : {})}
    >
      {type === 'arrow' && <ArrowGlyph />}
      {type === 'globeHorizontal' && <GlobeHorizontalGlyphs />}
      {media?.type === 'image' && (
        // eslint-disable-next-line @next/next/no-img-element -- cursor image src is dynamic, next/image overhead unwanted
        <img className={styles.cursor__media} src={media.src} alt="" draggable={false} />
      )}
      {media?.type === 'video' && (
        <video className={styles.cursor__media} src={media.src} autoPlay muted loop playsInline />
      )}
    </div>
  )
}

function applyTranslate(node: HTMLDivElement | null, x: number, y: number) {
  if (!node) return
  node.style.setProperty('--cursor-x', `${x}px`)
  node.style.setProperty('--cursor-y', `${y}px`)
}

function applyStyleProps(node: HTMLDivElement | null, styleProps: CursorStore['styleProps']) {
  if (!node) return

  setOrClear(node, '--cursor-width', styleProps.width)
  setOrClear(node, '--cursor-height', styleProps.height)
  setOrClear(node, '--cursor-border-radius', styleProps.borderRadius)
  setOrClear(node, '--cursor-bg-color', styleProps.backgroundColor)
  setOrClear(node, '--cursor-border-color', styleProps.borderColor)
  setOrClear(node, '--cursor-rotate', styleProps.rotate == null ? null : `${styleProps.rotate}deg`)
}

function setOrClear(node: HTMLDivElement, propertyName: string, value: string | null | undefined) {
  if (value !== undefined && value !== null) {
    node.style.setProperty(propertyName, value)
  } else {
    node.style.removeProperty(propertyName)
  }
}

/** move-horizontal (arrows + center line); motion via `[data-globe-hit]` CSS */
function GlobeHorizontalGlyphs() {
  return (
    <svg
      className={styles.cursor__globeHorizontal}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="m18 8 4 4-4 4" />
      <path d="M2 12h20" />
      <path d="m6 8-4 4 4 4" />
    </svg>
  )
}

function ArrowGlyph() {
  return (
    <svg
      className={styles.cursor__arrow}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}
