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
  const applyActiveStylesRef = useRef(applyActiveStyles)
  applyActiveStylesRef.current = applyActiveStyles

  const reapplyActiveStyles = useCallback(() => {
    if (!applyActiveStylesRef.current) return
    if (!isInteracting.current) return
    const node = elementRef.current
    if (!node) return
    if (lockPosition) {
      lockAtPosition(getElementCenter(node))
    }
    const next = applyActiveStylesRef.current(node)
    if (next) {
      setStyle(next)
    }
  }, [lockPosition, lockAtPosition, elementRef, setStyle])

  const handleInteractionStart = useCallback(() => {
    if (isInteracting.current) return
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

    const activeStyles = applyActiveStylesRef.current?.(node)
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
    setStyle
  ])

  const handleInteraction = useCallback(() => {
    const node = elementRef.current
    if (!node) return
    onInteraction?.(node)
    reapplyActiveStyles()
  }, [onInteraction, elementRef, reapplyActiveStyles])

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

  const syncInteractionWithLastPointer = useCallback(() => {
    const node = elementRef.current
    if (!node) return
    const { pointerX, pointerY } = useCursorStore.getState()
    if (!isPointerOverElement(node, pointerX, pointerY)) {
      if (isInteracting.current) {
        handleInteractionEnd()
      }
      return
    }
    if (!isInteracting.current) {
      handleInteractionStart()
    } else {
      reapplyActiveStyles()
    }
  }, [elementRef, handleInteractionStart, handleInteractionEnd, reapplyActiveStyles])

  useEffect(() => {
    const node = elementRef.current
    if (!node) return

    attachEnterEvents(node, handleInteractionStart)
    attachMoveEvents(node, handleInteraction)
    attachLeaveEvents(node, handleInteractionEnd)

    let ro: ResizeObserver | null = null
    let rafId = 0
    if (applyActiveStylesRef.current) {
      const schedule = () => {
        cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => reapplyActiveStyles())
      }
      ro = new ResizeObserver(schedule)
      ro.observe(node)
    }

    return () => {
      cancelAnimationFrame(rafId)
      ro?.disconnect()
      detachAllEvents(node, handleInteractionStart, handleInteraction, handleInteractionEnd)
    }
  }, [
    elementRef,
    handleInteractionStart,
    handleInteraction,
    handleInteractionEnd,
    reapplyActiveStyles
  ])

  useEffect(() => {
    const options: AddEventListenerOptions = { capture: true }
    globalThis.addEventListener('scroll', syncInteractionWithLastPointer, options)
    globalThis.addEventListener('resize', syncInteractionWithLastPointer)
    return () => {
      globalThis.removeEventListener('scroll', syncInteractionWithLastPointer, options)
      globalThis.removeEventListener('resize', syncInteractionWithLastPointer)
    }
  }, [syncInteractionWithLastPointer])

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
