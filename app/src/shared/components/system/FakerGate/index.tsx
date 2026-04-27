import type { ReactNode } from 'react'
import { env } from '~/env'

export interface Props {
  children: ReactNode
  fallback?: ReactNode
}

function isFakerOn(): boolean {
  const value: unknown = env.NEXT_PUBLIC_USE_FAKE_DATA
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase()
    return normalised === 'true' || normalised === '1' || normalised === 'yes'
  }
  return Boolean(value)
}

/**
 * Renders children only when the public faker flag is enabled. Used to gate
 * demo data references (mock profile links, sample CTAs) from real-data UI.
 */
export function FakerOnly({ children, fallback = null }: Props) {
  return isFakerOn() ? <>{children}</> : <>{fallback}</>
}

/**
 * Inverse of `FakerOnly` — renders only when the faker flag is off (real data).
 */
export function RealOnly({ children, fallback = null }: Props) {
  return isFakerOn() ? <>{fallback}</> : <>{children}</>
}

export default FakerOnly
