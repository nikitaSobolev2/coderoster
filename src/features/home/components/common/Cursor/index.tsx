'use client'

import { useEffect, useRef } from 'react'
import styles from './styles.module.scss'
import { useCursorStore, type CursorState } from './cursor.store'

export default function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const localAnimatedPos = useRef({ x: 0, y: 0 })

  const { isLocked, x: targetX, y: targetY, styleProps, setPosition } = useCursorStore()

  useEffect(() => {
    // Initialize local animated position ONCE on mount from the store's initial state
    // This assumes that if the page loads and the cursor is already locked at a specific spot,
    // localAnimatedPos should start there.
    const initialStoreX = useCursorStore.getState().x;
    const initialStoreY = useCursorStore.getState().y;
    localAnimatedPos.current = { x: initialStoreX, y: initialStoreY };

    if (cursorRef.current) { // Also apply initial position to CSS if locked
        if (useCursorStore.getState().isLocked) {
            cursorRef.current.style.setProperty('--cursor-x', initialStoreX + 'px');
            cursorRef.current.style.setProperty('--cursor-y', initialStoreY + 'px');
        } else {
            cursorRef.current.style.setProperty('--cursor-x', localAnimatedPos.current.x + 'px');
            cursorRef.current.style.setProperty('--cursor-y', localAnimatedPos.current.y + 'px');
        }
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Always update the store's target position with raw mouse coords
      setPosition({ x: e.clientX, y: e.clientY })
    }
    document.addEventListener('mousemove', handleMouseMove)

    let animationFrameId: number
    const animate = () => {
      // Read latest lock state and target DIRECTLY from store for up-to-date values in animation frame
      const currentIsLocked = useCursorStore.getState().isLocked;
      const currentTargetX = useCursorStore.getState().x;
      const currentTargetY = useCursorStore.getState().y;

      if (cursorRef.current) {
        if (!currentIsLocked) {
          localAnimatedPos.current.x += (currentTargetX - localAnimatedPos.current.x) * 0.08
          localAnimatedPos.current.y += (currentTargetY - localAnimatedPos.current.y) * 0.08
          cursorRef.current.style.setProperty('--cursor-x', localAnimatedPos.current.x + 'px')
          cursorRef.current.style.setProperty('--cursor-y', localAnimatedPos.current.y + 'px')
        } else {
          // If locked, snap visual position to store's x,y (locked position)
          // And also update localAnimatedPos to prevent jump on unlock
          localAnimatedPos.current.x = currentTargetX;
          localAnimatedPos.current.y = currentTargetY;
          cursorRef.current.style.setProperty('--cursor-x', currentTargetX + 'px')
          cursorRef.current.style.setProperty('--cursor-y', currentTargetY + 'px')
        }
      }
      animationFrameId = requestAnimationFrame(animate)
    }
    animate() // Start the animation loop

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [setPosition]) // setPosition is a stable function from Zustand, so this effect runs once.

  // Effect to update custom styles from store - this remains separate
  useEffect(() => {
    if (cursorRef.current) {
      const { width, height, borderRadius, backgroundColor } = styleProps
      if (width !== undefined && width !== null) {
        cursorRef.current.style.setProperty('--cursor-width', width)
      } else {
        cursorRef.current.style.removeProperty('--cursor-width')
      }
      if (height !== undefined && height !== null) {
        cursorRef.current.style.setProperty('--cursor-height', height)
      } else {
        cursorRef.current.style.removeProperty('--cursor-height')
      }
      if (borderRadius !== undefined && borderRadius !== null) {
        cursorRef.current.style.setProperty('--cursor-border-radius', borderRadius)
      } else {
        cursorRef.current.style.removeProperty('--cursor-border-radius')
      }
      if (backgroundColor !== undefined && backgroundColor !== null) {
        cursorRef.current.style.setProperty('--cursor-bg-color', backgroundColor)
      } else {
        cursorRef.current.style.removeProperty('--cursor-bg-color')
      }
    }
  }, [styleProps])

  return <div ref={cursorRef} className={styles.cursor} />
}
