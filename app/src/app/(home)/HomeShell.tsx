'use client'

import { useLayoutEffect, useRef, type ReactNode } from 'react'

import { registerHomeThreatShellHost } from '~/features/home/components/3d/models/Planet/homeDangerTheme.dom'

import styles from './layout.module.scss'

export function HomeShell({ children }: Readonly<{ children: ReactNode }>) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    registerHomeThreatShellHost(ref.current)
    return () => registerHomeThreatShellHost(null)
  }, [])

  return (
    <div ref={ref} className={styles.homeShell}>
      {children}
    </div>
  )
}
