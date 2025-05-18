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
    const initialX = useCursorStore.getState().x;
    const initialY = useCursorStore.getState().y;
    localAnimatedPos.current = { x: initialX, y: initialY };

    if (cursorRef.current) {
        cursorRef.current.style.setProperty('--cursor-x', initialX + 'px');
        cursorRef.current.style.setProperty('--cursor-y', initialY + 'px');
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
      const { width, height, borderRadius, backgroundColor, borderColor } = styleProps;
      const updateStyleProp = (propName: string, value: string | null | undefined) => {
        if (cursorRef.current) {
          if (value !== undefined && value !== null) {
            cursorRef.current.style.setProperty(propName, value);
          } else {
            cursorRef.current.style.removeProperty(propName);
          }
        }
      };

      updateStyleProp('--cursor-width', width);
      updateStyleProp('--cursor-height', height);
      updateStyleProp('--cursor-border-radius', borderRadius);
      updateStyleProp('--cursor-bg-color', backgroundColor);
      updateStyleProp('--cursor-border-color', borderColor);
    }
  }, [styleProps]);

  return <div ref={cursorRef} className={styles.cursor} />
}
