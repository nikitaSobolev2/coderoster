'use client'

import { useRef, type AnchorHTMLAttributes } from 'react'
import { useCursorFillTarget } from '~/features/home/hooks/useCursorFillTarget'

export interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  cursorFillColor?: string
}

export default function InteractiveLink({ cursorFillColor, children, ...rest }: Props) {
  const ref = useRef<HTMLAnchorElement>(null)
  useCursorFillTarget(ref, cursorFillColor)

  return (
    <a ref={ref} {...rest}>
      {children}
    </a>
  )
}
