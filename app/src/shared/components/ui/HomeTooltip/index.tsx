'use client'

import { Tooltip, type TooltipProps } from '@mantine/core'
import clsx from 'clsx'

import styles from './styles.module.scss'

/** Same floating hint shell as logo (`PureButton`): blur + `--color-bg-el` + `--border-radius-button`. */
export default function HomeTooltip({ className, events: eventsProp, ...props }: TooltipProps) {
  const events = { hover: true, focus: true, touch: false, ...eventsProp }
  return (
    <Tooltip
      zIndex={999999}
      offset={16}
      className={clsx(styles.tooltip, className)}
      events={events}
      {...props}
    />
  )
}
