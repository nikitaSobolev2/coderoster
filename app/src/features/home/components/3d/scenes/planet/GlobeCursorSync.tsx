'use client'

import { useEffect, useRef } from 'react'
import { HOME_DESKTOP_INTERACTION_MQ } from '~/shared/constants/homeDesktopInteractionMediaQuery'
import { useGlobePointerStore } from '~/features/home/components/3d/models/Planet/globePointer.store'
import { useCursorStore } from '~/features/home/components/common/Cursor/cursor.store'
import { useMatchMedia } from '~/shared/hooks/useMatchMedia'

/**
 * Sets custom cursor glyph when hovering the globe hit surface (fine-pointer desktop).
 * Mantine alternative: `useMediaQuery` from `@mantine/hooks` with explicit SSR overrides;
 * HOME uses plain `window.matchMedia` via `useMatchMedia` — same breakpoints as custom cursor / parallax.
 */
export default function GlobeCursorSync() {
  const desktopFine = useMatchMedia(HOME_DESKTOP_INTERACTION_MQ)
  const pointerOverGlobe = useGlobePointerStore(s => s.pointerOverGlobe)
  const homeCursorSuspended = useCursorStore(s => s.homeCursorSuspended)

  /** Avoid clobbering other cursor modes (arrow/link/hover-fill). Only clear our mode. */
  const previousWasGlobe = useRef(false)

  useEffect(() => {
    const store = useCursorStore.getState()
    if (!desktopFine || !pointerOverGlobe || homeCursorSuspended) {
      if (previousWasGlobe.current && store.type === 'globeHorizontal') {
        store.resetType()
      }
      previousWasGlobe.current = false
      return
    }
    store.setType('globeHorizontal')
    previousWasGlobe.current = true
  }, [desktopFine, pointerOverGlobe, homeCursorSuspended])

  return null
}
