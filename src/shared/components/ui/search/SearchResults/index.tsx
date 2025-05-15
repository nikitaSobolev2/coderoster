'use client'

import { Children } from 'react'
import { Spotlight } from '@mantine/spotlight'
import type SearchResult from '../SearchResult'
import styles from './styles.module.scss'

type ChildType = typeof SearchResult

export interface Props {
  children: React.ReactElement<ChildType> | React.ReactElement<ChildType>[]
}

export default function SearchResults({ children }: Props) {
  return (
    <Spotlight.ActionsList className={styles.content__actions}>
      {Children.toArray(children).length > 0 ? (
        children
      ) : (
        <Spotlight.Empty className={styles.actions__empty}>
          Ничего не найдено
        </Spotlight.Empty>
      )}
    </Spotlight.ActionsList>
  )
}
