'use client'

import { createElement, useRef, type ReactNode } from 'react'
import { useCursorScaleTarget } from '~/features/home/hooks/useCursorScaleTarget'

export type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4'

export interface Props {
  as?: HeadingTag
  size?: number
  filled?: boolean
  className?: string
  children: ReactNode
}

export default function InteractiveHeading({
  as = 'h2',
  size,
  filled = true,
  className = '',
  children
}: Props) {
  const ref = useRef<HTMLHeadingElement>(null)
  useCursorScaleTarget(ref, { size, filled })

  // Polymorphic heading; ref is for useCursorScaleTarget, not read during render.
  // eslint-disable-next-line react-hooks/refs -- createElement needs ref for cursor hook
  return createElement(as, { ref, className }, children)
}
