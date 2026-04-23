'use client'

import type React from 'react'
import { useEffect, useCallback, useRef } from 'react'
import {
  useCursorStore,
  type CursorStyleProps,
  type CursorType
} from '~/features/home/components/common/Cursor/cursor.store'

export interface Properties {
  lockPosition?: boolean
  cursorType?: CursorType
  onInteractionStart?: (element: HTMLElement) => void
  onInteraction?: (element: HTMLElement) => void
  onInteractionEnd?: (element: HTMLElement) => void
  applyActiveStyles?: (element: HTMLElement) => CursorStyleProps | null
}

export interface CursorInteraction {
  cursorStyles: CursorStyleProps
  cursorType: CursorType
  isInteracting: boolean
}

export function useCursorInteraction(
  elementRef: React.RefObject<HTMLElement>,
  {
    lockPosition = true,
    cursorType = 'default',
    onInteractionStart,
    onInteraction,
    onInteractionEnd,
    applyActiveStyles
  }: Properties
): CursorInteraction {
  const { setStyle, styleProps, resetStyle, lockAtPosition, setLocked, setType, resetType } =
    useCursorStore()

  const isInteracting = useRef(false)

  const handleInteractionStart = useCallback(() => {
    isInteracting.current = true

    onInteractionStart?.(elementRef.current)

    if (lockPosition) {
      lockAtPosition(getElementCenter(elementRef.current))
    }

    setType(cursorType)

    const activeStyles = applyActiveStyles?.(elementRef.current)
    if (activeStyles) {
      setStyle(activeStyles)
    }
  }, [
    onInteractionStart,
    lockPosition,
    lockAtPosition,
    elementRef,
    cursorType,
    setType,
    applyActiveStyles,
    setStyle
  ])

  const handleInteraction = useCallback(() => {
    onInteraction?.(elementRef.current)
  }, [onInteraction, elementRef])

  const handleInteractionEnd = useCallback(() => {
    isInteracting.current = false

    resetStyle()
    setLocked(false)
    resetType()

    onInteractionEnd?.(elementRef.current)
  }, [resetStyle, setLocked, onInteractionEnd, resetType, elementRef])

  useEffect(() => {
    if (!elementRef?.current) {
      return
    }

    const node = elementRef.current
    applyInteractionsStart(node, handleInteractionStart)
    applyActiveInteractions(node, handleInteraction)
    applyInteractionsEnd(node, handleInteractionEnd)

    return () => {
      removeAllInteractions(node, handleInteractionStart, handleInteraction, handleInteractionEnd)
    }
  }, [elementRef, handleInteractionStart, handleInteraction, handleInteractionEnd])

  return {
    cursorStyles: styleProps,
    cursorType,
    isInteracting: isInteracting.current
  }
}

function applyInteractionsStart(node: HTMLElement, handleInteractionStart: () => void) {
  node.addEventListener('mouseenter', handleInteractionStart)
  node.addEventListener('focus', handleInteractionStart)
  node.addEventListener('focusin', handleInteractionStart)
}

function applyActiveInteractions(node: HTMLElement, handleInteraction: () => void) {
  node.addEventListener('mousemove', handleInteraction)
}

function applyInteractionsEnd(node: HTMLElement, handleInteractionEnd: () => void) {
  node.addEventListener('mouseleave', handleInteractionEnd)
  node.addEventListener('blur', handleInteractionEnd)
  node.addEventListener('focusout', handleInteractionEnd)
}

function removeAllInteractions(
  node: HTMLElement,
  handleInteractionStart: () => void,
  handleInteraction: () => void,
  handleInteractionEnd: () => void
) {
  node.removeEventListener('mouseenter', handleInteractionStart)
  node.removeEventListener('focus', handleInteractionStart)
  node.removeEventListener('focusin', handleInteractionStart)

  node.removeEventListener('mousemove', handleInteraction)

  node.removeEventListener('mouseleave', handleInteractionEnd)
  node.removeEventListener('blur', handleInteractionEnd)
  node.removeEventListener('focusout', handleInteractionEnd)
}

function getElementCenter(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  }
}
