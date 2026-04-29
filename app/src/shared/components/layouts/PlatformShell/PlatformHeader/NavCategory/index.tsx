'use client'

import Link from 'next/link'
import { HoverCard } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import type { NavCategoryConfig, NavLeaf } from '../categories'
import CategoriesMegaMenu from './CategoriesMegaMenu'
import styles from './styles.module.scss'

export interface Props {
  category: NavCategoryConfig
}

/**
 * Header dropdown: CMS categories use {@link CategoriesMegaMenu}; static sections use leaf cards.
 */
export default function NavCategory({ category }: Props) {
  if (category.href) {
    return (
      <Link className={styles.navCategory__link} href={category.href}>
        {category.label}
      </Link>
    )
  }

  if (category.categoryTree?.length) {
    return <CategoriesMegaMenu label={category.label} parents={category.categoryTree} />
  }

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
      classNames={{ dropdown: styles.navCategory__dropdown }}
    >
      <HoverCard.Target>
        <button type="button" className={styles.navCategory__trigger}>
          <span>{category.label}</span>
          <FontAwesomeIcon icon={faChevronDown} className={styles.navCategory__chevron} />
        </button>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <ul className={styles.navCategory__panel}>
          {(category.items ?? []).map(item => (
            <NavLeafItem key={item.id} item={item} />
          ))}
        </ul>
      </HoverCard.Dropdown>
    </HoverCard>
  )
}

function NavLeafItem({ item }: { item: NavLeaf }) {
  return (
    <li>
      <Link className={styles.leaf} href={item.href} prefetch={false}>
        {item.icon ? (
          <span className={styles.leaf__icon}>
            <FontAwesomeIcon icon={item.icon} />
          </span>
        ) : null}
        <span className={styles.leaf__body}>
          <span className={styles.leaf__title}>{item.title}</span>
          <span className={styles.leaf__description}>{item.description}</span>
        </span>
      </Link>
    </li>
  )
}
