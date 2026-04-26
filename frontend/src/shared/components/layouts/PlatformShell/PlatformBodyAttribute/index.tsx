'use client'

import { useEffect } from 'react'

const ATTR = 'data-platform-shell'

/**
 * Marks the document body while the platform shell is mounted so that the
 * global "custom cursor" CSS rules in `globals.scss` get overridden back to
 * native pointer/text cursors.
 */
export default function PlatformBodyAttribute() {
  useEffect(() => {
    document.body.setAttribute(ATTR, 'true')
    return () => {
      document.body.removeAttribute(ATTR)
    }
  }, [])

  return null
}
