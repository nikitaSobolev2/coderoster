'use client'

import { Checkbox, Stack } from '@mantine/core'
import styles from './styles.module.scss'

export interface Props {
  /** Render label and inverse the checkbox: checked = field hidden. */
  label: string
  /** When true, the optional field's editor is hidden. */
  hidden: boolean
  /** Toggle handler. Receives the new `hidden` value. */
  onChange: (next: boolean) => void
  /** The field editor; only mounted when `hidden === false`. */
  children: React.ReactNode
}

/**
 * UX primitive used across the course editor: nullable fields default to
 * hidden behind a "this field is unused" checkbox. Reduces visual noise on
 * the autotests + result panels where most fields are unused most of the
 * time.
 */
export default function OptionalFieldToggle({ label, hidden, onChange, children }: Props) {
  return (
    <Stack gap="xs" className={styles.toggle}>
      <Checkbox
        label={label}
        checked={hidden}
        onChange={event => onChange(event.currentTarget.checked)}
      />
      {hidden ? null : <div className={styles.toggle__field}>{children}</div>}
    </Stack>
  )
}
