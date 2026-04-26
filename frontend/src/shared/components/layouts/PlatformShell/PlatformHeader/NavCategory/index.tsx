'use client'

import Link from 'next/link'
import { HoverCard } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import type { NavCategoryConfig, NavLeaf } from '../categories'
import styles from './styles.module.scss'

export interface Props {
  category: NavCategoryConfig
}

/**
 * Single header dropdown. Standalone link if the category has a `href`,
 * otherwise renders a hover-revealed mega-menu with up to N feature cards.
 */
export default function NavCategory({ category }: Props) {
  if (category.href) {
    return (
      <Link className={styles.navCategory__link} href={category.href}>
        {category.label}
      </Link>
    )
  }

  return (
    <HoverCard
      openDelay={80}
      closeDelay={120}
      position="bottom-start"
      offset={12}
      shadow="xl"
      withinPortal={false}
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
      <Link className={styles.leaf} href={item.href}>
        <span className={styles.leaf__icon}>
          <FontAwesomeIcon icon={item.icon} />
        </span>
        <span className={styles.leaf__body}>
          <span className={styles.leaf__title}>{item.title}</span>
          <span className={styles.leaf__description}>{item.description}</span>
        </span>
      </Link>
    </li>
  )
}
