'use client'

import type React from 'react'
import { useEffect, useCallback } from 'react'
import { useCursorStore, type CursorStyleProps } from '~/features/home/components/common/Cursor/cursor.store'

// Hook to be used by elements that should trigger the cursor fill effect
export function useCursorOutlineTarget(elementRef: React.RefObject<HTMLElement | null>) {
  const {
    setStyle,
    resetStyle,
    lockAtPosition,
    setLocked,
  } = useCursorStore((state) => ({
    setStyle: state.setStyle,
    resetStyle: state.resetStyle,
    lockAtPosition: state.lockAtPosition,
    setLocked: state.setLocked,
  }))

  const handleInteractionStart = useCallback(() => {
    if (elementRef.current) {
      const element = elementRef.current
      const rect = element.getBoundingClientRect()
      const computedStyle = window.getComputedStyle(element)
      const fillStyles: CursorStyleProps = {
        width: rect.width + 8 + 'px',
        height: rect.height + 8 + 'px',
        borderRadius: computedStyle.borderRadius,
        borderColor: computedStyle.color,
      }
      setStyle(fillStyles)
      // Lock at the CENTER of the element for current SCSS transform
      lockAtPosition({ 
        x: rect.left + rect.width / 2, 
        y: rect.top + rect.height / 2 
      })
    }
  }, [elementRef, setStyle, lockAtPosition])

  const handleInteractionEnd = useCallback(() => {
    resetStyle()
    setLocked(false) // Unlock the cursor
  }, [resetStyle, setLocked])

  useEffect(() => {
    const node = elementRef.current
    if (node) {
      node.addEventListener('mouseenter', handleInteractionStart)
      node.addEventListener('mouseleave', handleInteractionEnd)
      node.addEventListener('focus', handleInteractionStart)
      node.addEventListener('blur', handleInteractionEnd)

      return () => {
        node.removeEventListener('mouseenter', handleInteractionStart)
        node.removeEventListener('mouseleave', handleInteractionEnd)
        node.removeEventListener('focus', handleInteractionStart)
        node.removeEventListener('blur', handleInteractionEnd)
      }
    }
  }, [elementRef, handleInteractionStart, handleInteractionEnd])
}
