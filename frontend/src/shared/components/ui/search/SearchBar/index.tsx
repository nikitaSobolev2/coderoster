'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import KeyboardBadge from '~/shared/components/ui/KeyboardBadge'
import styles from './styles.module.scss'
import { useCursorOutlineTarget } from '~/features/home/hooks/useCursorOutlineTarget'
import { useRef } from 'react'

export interface Props {
  placeholder: string
  searchQuery: string
  openSearch: () => void
}

export default function SearchBar({ searchQuery, placeholder, openSearch }: Props) {
  const value = searchQuery.length ? searchQuery : placeholder
  const isActive = !!searchQuery.length
  const ref = useRef<HTMLButtonElement>(null)

  useCursorOutlineTarget(ref)

  return (
    <button className={styles.search__bar} onClick={openSearch} ref={ref}>
      <span className={styles.bar__icon}>
        <FontAwesomeIcon className={styles.icon__svg} icon={faMagnifyingGlass} />
      </span>
      <p className={styles.bar__input} data-active={isActive}>
        {value}
      </p>
      <KeyboardBadge className={styles.bar__badge} keys={'/'} />
    </button>
  )
}
