'use client'

import clsx from 'clsx'
import styles from './VerticalCaption.module.scss'

export interface VerticalCaptionProps {
  text: string
  tone?: 'default' | 'muted'
  /** Large rail for collapsed task pane (ordinal + title only). */
  density?: 'default' | 'taskRail'
  className?: string
  /** Parent region exposes full label — hide caption from SR to avoid duplication. */
  decorative?: boolean
}

/**
 * Renders Cyrillic/Latin headings one grapheme cluster per row (narrow rails).
 */
export default function VerticalCaption({
  text,
  tone = 'default',
  density = 'default',
  className,
  decorative = false
}: VerticalCaptionProps) {
  const glyphs = [...text]

  const rootClass =
    density === 'taskRail' ? styles.rootTaskRail : tone === 'muted' ? styles.rootMuted : styles.root

  return (
    <span
      className={clsx(rootClass, className)}
      {...(decorative ? { 'aria-hidden': true } : { 'aria-label': text })}
    >
      {glyphs.map((ch, idx) =>
        ch === ' ' ? (
          <span key={`${idx}-sp`} className={styles.charSpace}>
            &nbsp;
          </span>
        ) : (
          <span key={`${idx}-${ch}`} className={styles.char}>
            {ch}
          </span>
        )
      )}
    </span>
  )
}
