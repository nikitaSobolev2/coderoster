'use client'

import { useState } from 'react'

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
  if (typeof window === 'undefined') {
    return DEFAULT_COURSES_GRID_DENSITY
  }
  const raw = window.localStorage.getItem(COURSES_GRID_DENSITY_STORAGE_KEY)
  if (raw === 'list' || raw === 'comfortable' || raw === 'compact') return raw
  return DEFAULT_COURSES_GRID_DENSITY
}

export function useCoursesGridDensity() {
  const [density, setDensityState] = useState<CoursesGridDensity>(() => {
    if (typeof window === 'undefined') return DEFAULT_COURSES_GRID_DENSITY
    return readDensity()
  })

  const setDensity = (next: CoursesGridDensity) => {
    setDensityState(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(COURSES_GRID_DENSITY_STORAGE_KEY, next)
    }
  }

  return [density, setDensity] as const
}
