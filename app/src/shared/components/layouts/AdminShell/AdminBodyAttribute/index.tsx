'use client'

import { useEffect } from 'react'

const ATTR = 'data-admin-shell'

/**
 * Mirrors {@link ~/shared/components/layouts/PlatformShell/PlatformBodyAttribute}:
 * chrome cursor/text rules in `globals.scss` apply while admin chrome mounts.
 */
export default function AdminBodyAttribute() {
  useEffect(() => {
    document.body.setAttribute(ATTR, 'true')
    return () => {
      document.body.removeAttribute(ATTR)
    }
  }, [])

  return null
}
