'use client'

import { useEffect, useRef } from 'react'

const MAX_OFFSET_PX = 28

/** Inverted pointer parallax on the grid layer; DOM writes only (no re-render per move). */
export function useHomeGridPointerParallax() {
  const layerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return

    const reducedMotion = globalThis.matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) return

    const handleMouseMove = (event: MouseEvent) => {
      const viewportWidth = globalThis.innerWidth
      const viewportHeight = globalThis.innerHeight
      if (viewportWidth === 0 || viewportHeight === 0) return

      const normalizedX = (event.clientX / viewportWidth) * 2 - 1
      const normalizedY = (event.clientY / viewportHeight) * 2 - 1

      const offsetX = -normalizedX * MAX_OFFSET_PX
      const offsetY = -normalizedY * MAX_OFFSET_PX

      layer.style.transform = `translateX(calc(-50% + ${offsetX}px)) translateY(${offsetY}px)`
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return layerRef
}
