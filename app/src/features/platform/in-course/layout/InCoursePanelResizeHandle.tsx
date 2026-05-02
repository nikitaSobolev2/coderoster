'use client'

import clsx from 'clsx'
import { PanelResizeHandle, type PanelResizeHandleProps } from 'react-resizable-panels'
import styles from './InCoursePanelResizeHandle.module.scss'

type Orientation = 'vertical' | 'horizontal'

export interface InCoursePanelResizeHandleProps extends Omit<PanelResizeHandleProps, 'id'> {
  orientation: Orientation
  /** Stable id for accessibility + autoSave pairing */
  resizeHandleId: string
}

export default function InCoursePanelResizeHandle({
  orientation,
  resizeHandleId,
  className,
  ...rest
}: InCoursePanelResizeHandleProps) {
  return (
    <PanelResizeHandle
      id={resizeHandleId}
      className={clsx(
        styles.handle,
        orientation === 'vertical' ? styles.handle_vertical : styles.handle_horizontal,
        className
      )}
      role="separator"
      aria-orientation={orientation}
      aria-label={orientation === 'vertical' ? 'Изменить ширину панелей' : 'Изменить высоту редактора'}
      {...rest}
    />
  )
}
