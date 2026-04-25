'use client'

import { spotlight } from '@mantine/spotlight'
import SearchBar, { type SearchBarLayout } from '../SearchBar'
import styles from './styles.module.scss'

export interface Props {
  searchQuery: string
  placeholder: string
  className?: string
  searchBarClassName?: string
  showKeyboardBadge?: boolean
  searchBarLayout?: SearchBarLayout
}

export default function Search({
  searchQuery,
  placeholder,
  className = '',
  searchBarClassName = '',
  showKeyboardBadge = true,
  searchBarLayout = 'default'
}: Props) {
  const openSearch = () => spotlight.open()

  return (
    <search className={`${styles.search} ${className}`.trim()}>
      <SearchBar
        className={searchBarClassName}
        layout={searchBarLayout}
        openSearch={openSearch}
        searchQuery={searchQuery}
        placeholder={placeholder}
        showKeyboardBadge={showKeyboardBadge}
      />
    </search>
  )
}
