import styles from './styles.module.scss'

export interface Props {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  /** Removes default padding so embedded tables can stretch edge-to-edge. */
  flush?: boolean
}

/**
 * Generic frosted-glass surface used as a section container on every admin
 * page. Keeps spacing, borders and typography consistent.
 */
export default function AdminCard({ title, description, actions, children, flush = false }: Props) {
  const hasHeader = title ?? description ?? actions
  return (
    <section className={styles.card}>
      {hasHeader ? (
        <header className={styles.card__header}>
          <div className={styles.card__heading}>
            {title ? <h2 className={styles.card__title}>{title}</h2> : null}
            {description ? <p className={styles.card__description}>{description}</p> : null}
          </div>
          {actions ? <div className={styles.card__actions}>{actions}</div> : null}
        </header>
      ) : null}
      <div className={flush ? styles.card__body_flush : styles.card__body}>{children}</div>
    </section>
  )
}
