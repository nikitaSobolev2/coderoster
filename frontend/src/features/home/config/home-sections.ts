import type { SectionDescriptor } from '~/features/home/components/common/SectionScroller/section-scroller.store'
import {
  BITTER_TRUTH_SECTION_ID,
  FEATURES_SECTION_ID,
  FOOTER_SECTION_ID,
  HERO_SECTION_ID,
  HOW_TO_START_SECTION_ID,
  WHAT_TO_DO_SECTION_ID
} from '~/features/home/components/sections/section-ids'

/**
 * Home landing section order, labels for ScrollHint, and per-link nav copy (left nav + mobile).
 */
export const HOME_SECTIONS: readonly SectionDescriptor[] = [
  { id: HERO_SECTION_ID, label: 'О нас', nextLabel: 'Горькая правда' },
  { id: BITTER_TRUTH_SECTION_ID, label: 'Горькая правда', nextLabel: 'Решение' },
  { id: WHAT_TO_DO_SECTION_ID, label: 'Решение', nextLabel: 'Как начать' },
  { id: HOW_TO_START_SECTION_ID, label: 'Как начать', nextLabel: 'Платформа' },
  { id: FEATURES_SECTION_ID, label: 'Платформа', nextLabel: 'Контакты' },
  { id: FOOTER_SECTION_ID, label: 'Контакты' }
]

export const HOME_NAV_TEXT_BY_ID: Readonly<Record<string, string>> = {
  [HERO_SECTION_ID]: 'о нас',
  [BITTER_TRUTH_SECTION_ID]: 'горькая правда',
  [WHAT_TO_DO_SECTION_ID]: 'что же делать?',
  [HOW_TO_START_SECTION_ID]: 'как начать?',
  [FEATURES_SECTION_ID]: 'платформа',
  [FOOTER_SECTION_ID]: 'контакты'
}

export function getHomeNavText(sectionId: string): string {
  return HOME_NAV_TEXT_BY_ID[sectionId] ?? sectionId
}
