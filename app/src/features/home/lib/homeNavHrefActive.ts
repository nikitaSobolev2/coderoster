'use client'

import { useMemo } from 'react'

import { useSectionScrollerStore } from '~/features/home/components/common/SectionScroller/section-scroller.store'

export function selectHomeNavHrefActive(href: string) {
  const targetId = href.startsWith('#') ? href.slice(1) : null
  return (state: ReturnType<typeof useSectionScrollerStore.getState>) => {
    if (!targetId) return false
    const activeId = state.sections[state.activeIndex]?.id
    return activeId === targetId
  }
}

export function useHomeNavHrefActive(href: string): boolean {
  const selector = useMemo(() => selectHomeNavHrefActive(href), [href])
  return useSectionScrollerStore(selector)
}
