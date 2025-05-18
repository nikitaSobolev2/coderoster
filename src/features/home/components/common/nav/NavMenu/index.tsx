import styles from './styles.module.scss'

export interface Props {
  className?: string
  children?: React.ReactNode
}

export default function NavMenu({ className = '', children }: Props) {
  return (
    <nav className={`${styles.navMenu} ${className}`}>
      <ul className={styles.navMenu__list}>{children}</ul>
    </nav>
  )
}
