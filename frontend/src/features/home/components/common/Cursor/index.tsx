'use client'

import { useEffect, useRef } from 'react'
import styles from './styles.module.scss'
import { useCursorStore, type CursorStore } from './cursor.store'

const FOLLOW_LERP = 0.18

export default function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const localAnimatedPos = useRef({ x: 0, y: 0 })

  const setPosition = useCursorStore((state: CursorStore) => state.setPosition)
  const styleProps = useCursorStore((state: CursorStore) => state.styleProps)
  const media = useCursorStore((state: CursorStore) => state.media)
  const type = useCursorStore((state: CursorStore) => state.type)

  useEffect(() => {
    const initialX = useCursorStore.getState().x
    const initialY = useCursorStore.getState().y
    localAnimatedPos.current = { x: initialX, y: initialY }

    applyTranslate(cursorRef.current, initialX, initialY)

    const handleMouseMove = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY })
    }
    document.addEventListener('mousemove', handleMouseMove)

    let animationFrameId: number
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
  }, [setPosition])

  useEffect(() => {
    applyStyleProps(cursorRef.current, styleProps)
  }, [styleProps])

  return (
    <div ref={cursorRef} className={styles.cursor} data-cursor-type={type}>
      {type === 'arrow' && <ArrowGlyph />}
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
  setOrClear(node, '--cursor-rotate', styleProps.rotate != null ? `${styleProps.rotate}deg` : null)
}

function setOrClear(node: HTMLDivElement, propertyName: string, value: string | null | undefined) {
  if (value !== undefined && value !== null) {
    node.style.setProperty(propertyName, value)
  } else {
    node.style.removeProperty(propertyName)
  }
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
