'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import KeyboardBadge from '~/shared/components/ui/KeyboardBadge'
import styles from './styles.module.scss'
import { useCursorOutlineTarget } from '~/features/home/hooks/useCursorOutlineTarget'
import { useRef } from 'react'

export type SearchBarLayout = 'default' | 'drawer'

export interface Props {
  placeholder: string
  searchQuery: string
  openSearch: () => void
  className?: string
  /** @default true */
  showKeyboardBadge?: boolean
  /** Mobile menu: full-bleed, no `min-width`, larger touch target */
  layout?: SearchBarLayout
}

export default function SearchBar({
  searchQuery,
  placeholder,
  openSearch,
  className = '',
  showKeyboardBadge = true,
  layout = 'default'
}: Props) {
  const value = searchQuery.length ? searchQuery : placeholder
  const isActive = !!searchQuery.length
  const ref = useRef<HTMLButtonElement>(null)

  useCursorOutlineTarget(ref)

  return (
    <button
      className={[styles.search__bar, layout === 'drawer' && styles.search__bar_drawer, className]
        .filter(Boolean)
        .join(' ')}
      onClick={openSearch}
      ref={ref}
    >
      <span className={styles.bar__icon}>
        <FontAwesomeIcon className={styles.icon__svg} icon={faMagnifyingGlass} />
      </span>
      <p className={styles.bar__input} data-active={isActive}>
        {value}
      </p>
      {showKeyboardBadge ? <KeyboardBadge className={styles.bar__badge} keys="/" /> : null}
    </button>
  )
}
