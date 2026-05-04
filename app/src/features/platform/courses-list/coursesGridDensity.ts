'use client'

import { useCallback, useSyncExternalStore } from 'react'

export type CoursesGridDensity = 'list' | 'comfortable' | 'compact'

export const GRID_DENSITY_ORDER: CoursesGridDensity[] = ['list', 'comfortable', 'compact']

export const GRID_DENSITY_LABEL: Record<CoursesGridDensity, string> = {
  list: 'Подробный список — нажмите, чтобы переключить вид',
  comfortable: 'Сетка — нажмите, чтобы переключить вид',
  compact: 'Компактная сетка — нажмите, чтобы переключить вид'
}

export function nextCoursesGridDensity(current: CoursesGridDensity): CoursesGridDensity {
  const i = GRID_DENSITY_ORDER.indexOf(current)
  const next = GRID_DENSITY_ORDER[(i + 1) % GRID_DENSITY_ORDER.length]
  return next ?? 'comfortable'
}
export const COURSES_GRID_DENSITY_STORAGE_KEY = 'coderoster:courses:density' as const

export const DEFAULT_COURSES_GRID_DENSITY: CoursesGridDensity = 'comfortable'

function readDensity(): CoursesGridDensity {
  const raw = window.localStorage.getItem(COURSES_GRID_DENSITY_STORAGE_KEY)
  if (raw === 'list' || raw === 'comfortable' || raw === 'compact') return raw
  return DEFAULT_COURSES_GRID_DENSITY
}

const densityListeners = new Set<() => void>()

function emitDensityChange() {
  for (const listener of densityListeners) listener()
}

function subscribeDensity(onStoreChange: () => void) {
  densityListeners.add(onStoreChange)
  const onStorage = (event: StorageEvent) => {
    if (event.key === COURSES_GRID_DENSITY_STORAGE_KEY || event.key === null) {
      onStoreChange()
    }
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage)
  }
  return () => {
    densityListeners.delete(onStoreChange)
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage)
    }
  }
}

function getDensitySnapshot(): CoursesGridDensity {
  if (typeof window === 'undefined') return DEFAULT_COURSES_GRID_DENSITY
  return readDensity()
}

function getDensityServerSnapshot(): CoursesGridDensity {
  return DEFAULT_COURSES_GRID_DENSITY
}

/**
 * Reads grid density from localStorage after hydration without mount-only `useEffect` sync.
 */
export function useCoursesGridDensity() {
  const density = useSyncExternalStore(
    subscribeDensity,
    getDensitySnapshot,
    getDensityServerSnapshot
  )

  const setDensity = useCallback((next: CoursesGridDensity) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(COURSES_GRID_DENSITY_STORAGE_KEY, next)
    emitDensityChange()
  }, [])

  return [density, setDensity] as const
}
