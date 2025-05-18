'use client'

import { useRef } from 'react'
import { Spotlight } from '@mantine/spotlight'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { useCursorOutlineTarget } from '~/features/home/hooks/useCursorOutlineTarget'
import styles from './styles.module.scss'
  
export interface Props {
  placeholder: string
  onChange?: (e: React.ChangeEvent) => void
}

export default function SearchSpotlightBar({ placeholder, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null)

  useCursorOutlineTarget(ref)

  return (
    <Spotlight.Search
      ref={ref}
      onChange={onChange}
      placeholder={placeholder}
      leftSection={<FontAwesomeIcon icon={faMagnifyingGlass} />}
      className={styles.content__search}
      classNames={{
        input: styles.search__input,
        section: styles.search__icon,
      }}
    />
  )
}
