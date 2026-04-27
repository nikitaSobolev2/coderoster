import styles from './styles.module.scss'

export interface AdminStat {
  label: string
  value: number
  hint?: string
}

export interface Props {
  stats: AdminStat[]
}

/**
 * Compact metric grid used on the admin dashboard. Reads `prefers-reduced-motion`
 * via CSS, no JS animation — keeps the surface server-friendly.
 */
export default function AdminStatGrid({ stats }: Props) {
  return (
    <ul className={styles.grid}>
      {stats.map(stat => (
        <li key={stat.label} className={styles.card}>
          <span className={styles.card__label}>{stat.label}</span>
          <span className={styles.card__value}>{stat.value.toLocaleString('ru-RU')}</span>
          {stat.hint ? <span className={styles.card__hint}>{stat.hint}</span> : null}
        </li>
      ))}
    </ul>
  )
}
