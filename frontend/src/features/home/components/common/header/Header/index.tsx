'use client'

import { useMatchMedia } from '~/shared/hooks/useMatchMedia'
import HeaderDesktop from '../HeaderDesktop'
import HeaderIsland from '../HeaderIsland'

const ISLAND_MQ = '(max-width: 768px)'

export interface Props {
  className?: string
}

export default function Header({ className = '' }: Props) {
  const isIsland = useMatchMedia(ISLAND_MQ)

  return isIsland ? <HeaderIsland className={className} /> : <HeaderDesktop className={className} />
}
