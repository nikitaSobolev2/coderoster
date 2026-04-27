'use client'

import PureButton from '../PureButton'
import type { Props as PureButtonProps } from '../PureButton'
import styles from './styles.module.scss'

export type Props = PureButtonProps

export default function Button({ className = '', ...defaultProps }: Props) {
  return <PureButton className={`${styles.button} ${className}`} {...defaultProps} />
}
