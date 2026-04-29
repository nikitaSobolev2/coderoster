'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HoverCard, ScrollArea } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'

import type { CategoryNavParentRef } from '../categories'
import { courseCategoryHref } from '~/shared/lib/courseCategoryHref'
import { resolveIcon } from '~/shared/components/ui/IconOrImageField/iconMap'

import triggerStyles from './styles.module.scss'
import megaStyles from './CategoriesMegaMenu.module.scss'

const COLUMN_SCROLL_PX = 380

export interface Props {
  label: string
  parents: CategoryNavParentRef[]
}

/**
 * Two-column taxonomy mega-menu: scrollable parents (Laravel-style) + scrollable
 * children for the hovered/focused parent. Both columns link to `/courses`.
 */
export default function CategoriesMegaMenu({ label, parents }: Props) {
  const firstId = parents[0]?.id ?? ''
  const [activeId, setActiveId] = useState(firstId)

  useEffect(() => {
    setActiveId(parents[0]?.id ?? '')
  }, [parents])

  const activeParent = parents.find(p => p.id === activeId) ?? parents[0]

  return (
    <HoverCard
      openDelay={80}
      closeDelay={120}
      position="bottom-start"
      offset={12}
      shadow="xl"
      withinPortal
      zIndex={1500}
      floatingStrategy="fixed"
      hideDetached={false}
      middlewares={{ flip: true, shift: true, inline: false }}
      classNames={{
        dropdown: `${triggerStyles.navCategory__dropdown} ${megaStyles.dropdown}`
      }}
    >
      <HoverCard.Target>
        <button type="button" className={triggerStyles.navCategory__trigger}>
          <span>{label}</span>
          <FontAwesomeIcon icon={faChevronDown} className={triggerStyles.navCategory__chevron} />
        </button>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <div className={megaStyles.mega}>
          <nav className={megaStyles.mega__layout} aria-label={label}>
            <section className={megaStyles.mega__column} aria-labelledby="mega-parents-heading">
              <p id="mega-parents-heading" className={megaStyles.mega__heading}>
                Разделы
              </p>
              <ScrollArea h={COLUMN_SCROLL_PX} scrollbars="y" type="scroll">
                <ul className={megaStyles.mega__list}>
                  {parents.map(parent => (
                    <li key={parent.id}>
                      <Link
                        href={courseCategoryHref(parent.slug)}
                        className={
                          parent.id === activeId
                            ? `${megaStyles.parentRow} ${megaStyles.parentRow_active}`
                            : megaStyles.parentRow
                        }
                        onMouseEnter={() => setActiveId(parent.id)}
                        onFocus={() => setActiveId(parent.id)}
                        prefetch={false}
                      >
                        <span className={megaStyles.parentRow__icon} aria-hidden>
                          <FontAwesomeIcon icon={resolveIcon(parent.iconKey)} />
                        </span>
                        <span className={megaStyles.parentRow__text}>
                          <span className={megaStyles.parentRow__title}>{parent.title}</span>
                          {parent.summary ? (
                            <span className={megaStyles.parentRow__summary}>{parent.summary}</span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </section>
            <section className={megaStyles.mega__column} aria-labelledby="mega-children-heading">
              <p id="mega-children-heading" className={megaStyles.mega__heading}>
                {activeParent ? activeParent.title : 'Подкатегории'}
              </p>
              <ScrollArea h={COLUMN_SCROLL_PX} scrollbars="y" type="scroll">
                <ul className={megaStyles.mega__childList}>
                  {(activeParent?.children ?? []).map(child => (
                    <li key={child.id}>
                      <Link href={courseCategoryHref(child.slug)} className={megaStyles.childCard} prefetch={false}>
                        <span className={megaStyles.childCard__icon} aria-hidden>
                          <FontAwesomeIcon icon={resolveIcon(child.iconKey)} />
                        </span>
                        <span className={megaStyles.childCard__body}>
                          <span className={megaStyles.childCard__title}>{child.title}</span>
                          <span className={megaStyles.childCard__desc}>{child.summary}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
              {activeParent?.children.length === 0 ? (
                <p className={megaStyles.mega__empty}>
                  В этом разделе курсы привязаны к корню — перейдите по ссылке слева.
                </p>
              ) : null}
            </section>
          </nav>
        </div>
      </HoverCard.Dropdown>
    </HoverCard>
  )
}
