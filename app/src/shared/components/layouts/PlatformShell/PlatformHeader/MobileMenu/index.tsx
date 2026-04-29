'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Drawer } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleRight, faBars, faChevronDown, faXmark } from '@fortawesome/free-solid-svg-icons'

import { courseCategoryHref } from '~/shared/lib/courseCategoryHref'
import { resolveIcon } from '~/shared/components/ui/IconOrImageField/iconMap'
import type { NavCategoryConfig } from '../categories'
import styles from './styles.module.scss'

export interface Props {
  categories: NavCategoryConfig[]
}

function MobileExpandedSection({
  category,
  onNavigate
}: {
  category: NavCategoryConfig
  onNavigate: () => void
}) {
  if (category.categoryTree?.length) {
    return (
      <ul className={styles.drawer__tree}>
        {category.categoryTree.map(parent => (
          <li key={parent.id} className={styles.drawer__treeBlock}>
            <Link
              href={courseCategoryHref(parent.slug)}
              className={styles.drawer__treeParent}
              onClick={onNavigate}
              prefetch={false}
            >
              <span className={styles.drawer__treeIcon} aria-hidden>
                <FontAwesomeIcon icon={resolveIcon(parent.iconKey)} />
              </span>
              <span className={styles.drawer__treeParentText}>
                <span className={styles.drawer__treeTitle}>{parent.title}</span>
                {parent.summary ? (
                  <span className={styles.drawer__treeSummary}>{parent.summary}</span>
                ) : null}
              </span>
              <FontAwesomeIcon icon={faAngleRight} className={styles.drawer__treeGo} />
            </Link>
            <ul className={styles.drawer__treeSubs}>
              {parent.children.map(child => (
                <li key={child.id}>
                  <Link
                    href={courseCategoryHref(child.slug)}
                    className={styles.drawer__treeChild}
                    onClick={onNavigate}
                    prefetch={false}
                  >
                    <span className={styles.drawer__treeIcon} aria-hidden>
                      <FontAwesomeIcon icon={resolveIcon(child.iconKey)} />
                    </span>
                    <span className={styles.drawer__treeChildBody}>
                      <span className={styles.drawer__treeChildTitle}>{child.title}</span>
                      <span className={styles.drawer__treeChildDesc}>{child.summary}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className={styles.drawer__sublist}>
      {(category.items ?? []).map(item => (
        <li key={item.id}>
          <Link
            href={item.href}
            className={styles.drawer__sublink}
            onClick={onNavigate}
            prefetch={false}
          >
            {item.icon ? (
              <FontAwesomeIcon icon={item.icon} className={styles.drawer__subicon} />
            ) : null}
            <span className={styles.drawer__subbody}>
              <span className={styles.drawer__subtitle}>{item.title}</span>
              <span className={styles.drawer__subdesc}>{item.description}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

/**
 * Mobile-only burger trigger + Mantine Drawer hosting the platform navigation.
 * Sub-menus expand inline as accordion sections so users see the full route
 * tree in one swipe instead of stacked overlays.
 */
export default function MobileMenu({ categories }: Props) {
  const [opened, setOpened] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const close = () => setOpened(false)
  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <>
      <button
        type="button"
        aria-label="Открыть меню"
        aria-expanded={opened}
        className={styles.burger}
        onClick={() => setOpened(true)}
      >
        <FontAwesomeIcon icon={faBars} />
      </button>

      <Drawer
        opened={opened}
        onClose={close}
        position="right"
        size="min(92vw, 420px)"
        withCloseButton={false}
        overlayProps={{ backgroundOpacity: 0.55, blur: 6 }}
        classNames={{
          content: styles.drawer,
          body: styles.drawer__body
        }}
      >
        <header className={styles.drawer__head}>
          <span className={styles.drawer__title}>Меню</span>
          <button
            type="button"
            aria-label="Закрыть"
            className={styles.drawer__close}
            onClick={close}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>
        <nav aria-label="Платформа">
          <ul className={styles.drawer__list}>
            {categories.map(category => (
              <li key={category.id} className={styles.drawer__group}>
                {category.href ? (
                  <Link
                    href={category.href}
                    className={styles.drawer__link}
                    onClick={close}
                    prefetch={false}
                  >
                    <span>{category.label}</span>
                    <FontAwesomeIcon icon={faAngleRight} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={styles.drawer__trigger}
                    aria-expanded={Boolean(expanded[category.id])}
                    onClick={() => toggle(category.id)}
                  >
                    <span>{category.label}</span>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`${styles.drawer__chevron} ${
                        expanded[category.id] ? styles.drawer__chevron_open : ''
                      }`}
                    />
                  </button>
                )}
                {!category.href && expanded[category.id] ? (
                  <MobileExpandedSection category={category} onNavigate={close} />
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
      </Drawer>
    </>
  )
}
