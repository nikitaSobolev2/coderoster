'use client'

import type React from 'react'
import { useEffect, useCallback, useRef } from 'react'
import {
  useCursorStore,
  type CursorStyleProps,
  type CursorType,
  type CursorMedia
} from '~/features/home/components/common/Cursor/cursor.store'

export interface Properties {
  lockPosition?: boolean
  cursorType?: CursorType
  media?: CursorMedia | null
  onInteractionStart?: (element: HTMLElement) => void
  onInteraction?: (element: HTMLElement) => void
  onInteractionEnd?: (element: HTMLElement) => void
  applyActiveStyles?: (element: HTMLElement) => CursorStyleProps | null
}

export interface CursorInteraction {
  cursorStyles: CursorStyleProps
  cursorType: CursorType
}

export function useCursorInteraction(
  elementRef: React.RefObject<HTMLElement | null>,
  {
    lockPosition = true,
    cursorType = 'default',
    media = null,
    onInteractionStart,
    onInteraction,
    onInteractionEnd,
    applyActiveStyles
  }: Properties
): CursorInteraction {
  const setStyle = useCursorStore(state => state.setStyle)
  const styleProps = useCursorStore(state => state.styleProps)
  const resetStyle = useCursorStore(state => state.resetStyle)
  const lockAtPosition = useCursorStore(state => state.lockAtPosition)
  const setLocked = useCursorStore(state => state.setLocked)
  const setType = useCursorStore(state => state.setType)
  const resetType = useCursorStore(state => state.resetType)
  const setMedia = useCursorStore(state => state.setMedia)
  const resetMedia = useCursorStore(state => state.resetMedia)

  const isInteracting = useRef(false)

  const handleInteractionStart = useCallback(() => {
    const node = elementRef.current
    if (!node) return

    isInteracting.current = true
    onInteractionStart?.(node)

    if (lockPosition) {
      lockAtPosition(getElementCenter(node))
    }

    setType(cursorType)

    if (media) {
      setMedia(media)
    }

    const activeStyles = applyActiveStyles?.(node)
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
    media,
    setMedia,
    applyActiveStyles,
    setStyle
  ])

  const handleInteraction = useCallback(() => {
    const node = elementRef.current
    if (!node) return
    onInteraction?.(node)
  }, [onInteraction, elementRef])

  const handleInteractionEnd = useCallback(() => {
    const node = elementRef.current
    isInteracting.current = false

    resetStyle()
    setLocked(false)
    resetType()
    resetMedia()

    if (node) {
      onInteractionEnd?.(node)
    }
  }, [resetStyle, setLocked, onInteractionEnd, resetType, resetMedia, elementRef])

  useEffect(() => {
    const node = elementRef.current
    if (!node) return

    attachEnterEvents(node, handleInteractionStart)
    attachMoveEvents(node, handleInteraction)
    attachLeaveEvents(node, handleInteractionEnd)

    return () => {
      detachAllEvents(node, handleInteractionStart, handleInteraction, handleInteractionEnd)
    }
  }, [elementRef, handleInteractionStart, handleInteraction, handleInteractionEnd])

  useEffect(() => {
    const endIfPointerLeftTarget = () => {
      if (!isInteracting.current) return
      const node = elementRef.current
      if (!node) return
      const { pointerX, pointerY } = useCursorStore.getState()
      if (!isPointerOverElement(node, pointerX, pointerY)) {
        handleInteractionEnd()
      }
    }

    window.addEventListener('scroll', endIfPointerLeftTarget, true)
    return () => window.removeEventListener('scroll', endIfPointerLeftTarget, true)
  }, [handleInteractionEnd, elementRef])

  return {
    cursorStyles: styleProps,
    cursorType
  }
}

function attachEnterEvents(node: HTMLElement, handler: () => void) {
  node.addEventListener('mouseenter', handler)
  node.addEventListener('focus', handler)
  node.addEventListener('focusin', handler)
}

function attachMoveEvents(node: HTMLElement, handler: () => void) {
  node.addEventListener('mousemove', handler)
}

function attachLeaveEvents(node: HTMLElement, handler: () => void) {
  node.addEventListener('mouseleave', handler)
  node.addEventListener('blur', handler)
  node.addEventListener('focusout', handler)
}

function detachAllEvents(
  node: HTMLElement,
  startHandler: () => void,
  moveHandler: () => void,
  endHandler: () => void
) {
  node.removeEventListener('mouseenter', startHandler)
  node.removeEventListener('focus', startHandler)
  node.removeEventListener('focusin', startHandler)

  node.removeEventListener('mousemove', moveHandler)

  node.removeEventListener('mouseleave', endHandler)
  node.removeEventListener('blur', endHandler)
  node.removeEventListener('focusout', endHandler)
}

function getElementCenter(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  }
}

function isPointerOverElement(element: HTMLElement, clientX: number, clientY: number) {
  const hit = document.elementFromPoint(clientX, clientY)
  return hit != null && element.contains(hit)
}
