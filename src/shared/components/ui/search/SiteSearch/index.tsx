'use client'

import { useState } from 'react'
import Search from '../Search'

export default function SiteSearch() {
  const [searchQuery] = useState<string>('')

  return (
    <Search
      searchQuery={searchQuery}
      placeholder='Поиск'
    />
  )
}
