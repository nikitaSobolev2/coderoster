'use client'

import { spotlight } from '@mantine/spotlight'
import SearchBar from '../SearchBar'
import styles from './styles.module.scss'

export interface Props {
  searchQuery: string
  placeholder: string
}

export default function Search({ searchQuery, placeholder }: Props) {
  const openSearch = () => spotlight.open()

  return (
    <search className={styles.search}>
      <SearchBar openSearch={openSearch} searchQuery={searchQuery} placeholder={placeholder} />
    </search>
  )
}
