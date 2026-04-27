import styles from './styles.module.scss'

export interface Props {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

/**
 * Page-level header rendered above admin content. Title + optional subtitle
 * + right-side action slot (filters, "Создать" buttons, etc).
 */
export default function AdminPageHeader({ title, subtitle, actions }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.header__text}>
        <h1 className={styles.header__title}>{title}</h1>
        {subtitle ? <p className={styles.header__subtitle}>{subtitle}</p> : null}
      </div>
      {actions ? <div className={styles.header__actions}>{actions}</div> : null}
    </header>
  )
}
