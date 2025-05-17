'use client'

import { useEffect, useRef } from 'react'
import styles from './styles.module.scss'
import { useCursorStore, type CursorState } from './cursor.store'

export default function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const localAnimatedPos = useRef({ x: 0, y: 0 })

  const setPosition = useCursorStore((state: CursorState) => state.setPosition)
  const styleProps = useCursorStore((state: CursorState) => state.styleProps)

  useEffect(() => {
    localAnimatedPos.current = { 
      x: useCursorStore.getState().x, 
      y: useCursorStore.getState().y 
    };

    if (cursorRef.current) {
        cursorRef.current.style.setProperty('--cursor-x', localAnimatedPos.current.x + 'px');
        cursorRef.current.style.setProperty('--cursor-y', localAnimatedPos.current.y + 'px');
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }
    document.addEventListener('mousemove', handleMouseMove)

    let animationFrameId: number;
    const animate = () => {
      const currentTargetX = useCursorStore.getState().x;
      const currentTargetY = useCursorStore.getState().y;

      localAnimatedPos.current.x += (currentTargetX - localAnimatedPos.current.x) * 0.08;
      localAnimatedPos.current.y += (currentTargetY - localAnimatedPos.current.y) * 0.08;

      if (cursorRef.current) {
        cursorRef.current.style.setProperty('--cursor-x', localAnimatedPos.current.x + 'px');
        cursorRef.current.style.setProperty('--cursor-y', localAnimatedPos.current.y + 'px');
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [setPosition]);

  useEffect(() => {
    if (cursorRef.current) {
      const { width, height, borderRadius, backgroundColor } = styleProps;
      if (width !== undefined && width !== null) {
        cursorRef.current.style.setProperty('--cursor-width', width);
      } else {
        cursorRef.current.style.removeProperty('--cursor-width');
      }
      if (height !== undefined && height !== null) {
        cursorRef.current.style.setProperty('--cursor-height', height);
      } else {
        cursorRef.current.style.removeProperty('--cursor-height');
      }
      if (borderRadius !== undefined && borderRadius !== null) {
        cursorRef.current.style.setProperty('--cursor-border-radius', borderRadius);
      } else {
        cursorRef.current.style.removeProperty('--cursor-border-radius');
      }
      if (backgroundColor !== undefined && backgroundColor !== null) {
        cursorRef.current.style.setProperty('--cursor-bg-color', backgroundColor);
      } else {
        cursorRef.current.style.removeProperty('--cursor-bg-color');
      }
    }
  }, [styleProps]);

  return <div ref={cursorRef} className={styles.cursor} />
}
