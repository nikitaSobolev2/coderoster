'use client'

import type { ReactNode } from 'react'
import { useRef } from 'react'

import type { SectionDescriptor } from '~/features/home/components/common/SectionScroller/section-scroller.store'
import { useSectionScrollerStore } from '~/features/home/components/common/SectionScroller/section-scroller.store'
import { useCursorScaleTarget } from '~/features/home/hooks/useCursorScaleTarget'
import PureButton from '~/shared/components/ui/buttons/PureButton'
import { getHomeNavText } from '~/features/home/config/home-sections'
import { PLANS_HOME_NAV_LABEL, PLANS_NAV_LABEL, PLANS_PAGE_HREF } from '~/shared/constants/plansNav'
import { useHomeNavHrefActive } from '~/features/home/lib/homeNavHrefActive'

import styles from './styles.module.scss'

export interface HomeIntermediateSectionRailProps {
  sections: readonly SectionDescriptor[]
}

function RailHitMarkup({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <span className={styles.inner}>
      <span className={styles.label}>
        <span className={styles.labelShift}>{children}</span>
      </span>
      <span className={styles.line} aria-hidden />
    </span>
  )
}

/** Scroll-spy inactive: same magnetic circle cursor as {@link InteractiveHeading} section titles. */
function RailHitInactive({
  href,
  ariaLabel,
  children
}: Readonly<{
  href: string
  ariaLabel: string
  children: ReactNode
}>) {
  const ref = useRef<HTMLAnchorElement>(null)
  useCursorScaleTarget(ref, { filled: true })
  return (
    <PureButton ref={ref} href={href} className={styles.hit} aria-label={ariaLabel}>
      <RailHitMarkup>{children}</RailHitMarkup>
    </PureButton>
  )
}

function RailHitActive({
  href,
  ariaLabel,
  children
}: Readonly<{
  href: string
  ariaLabel: string
  children: ReactNode
}>) {
  return (
    <PureButton href={href} className={styles.hit} aria-label={ariaLabel}>
      <RailHitMarkup>{children}</RailHitMarkup>
    </PureButton>
  )
}

function IntermediateRailEntry({
  href,
  ariaLabel,
  children,
  sectionIndex = null
}: Readonly<{
  href: string
  ariaLabel: string
  children: ReactNode
  /** Index in `HOME_SECTIONS`; omit for non-hash links (e.g. plans). */
  sectionIndex?: number | null
}>) {
  const active = useHomeNavHrefActive(href)
  const activeIndex = useSectionScrollerStore(s => s.activeIndex)
  const passed = sectionIndex != null && sectionIndex < activeIndex && !active

  const itemClass = [
    styles.item,
    active ? styles.item_active : '',
    passed ? styles.item_passed : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li className={itemClass}>
      {active ? (
        <RailHitActive href={href} ariaLabel={ariaLabel}>
          {children}
        </RailHitActive>
      ) : (
        <RailHitInactive href={href} ariaLabel={ariaLabel}>
          {children}
        </RailHitInactive>
      )}
    </li>
  )
}

/**
 * Fixed right rail for mid-width viewports: replaces bottom-left {@link NavMenu} between
 * `$bp-nav-up` and `$bp-home-intermediate-max`.
 */
export default function HomeIntermediateSectionRail({
  sections
}: Readonly<HomeIntermediateSectionRailProps>) {
  return (
    <nav className={styles.rail} aria-label="Разделы лендинга (компактная навигация)">
      <ul className={styles.list}>
        {sections.map((section, index) => (
          <IntermediateRailEntry
            key={section.id}
            href={`#${section.id}`}
            ariaLabel={section.label}
            sectionIndex={index}
          >
            {getHomeNavText(section.id)}
          </IntermediateRailEntry>
        ))}
        <IntermediateRailEntry href={PLANS_PAGE_HREF} ariaLabel={PLANS_NAV_LABEL}>
          {PLANS_HOME_NAV_LABEL}
        </IntermediateRailEntry>
      </ul>
    </nav>
  )
}
