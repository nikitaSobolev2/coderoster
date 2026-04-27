import InteractiveHeading from '~/features/home/components/ui/InteractiveHeading'
import styles from './styles.module.scss'

export interface Props {
  number: string
  eyebrow: string
  title: string
  subtitle?: string
  className?: string
}

export default function SectionHeader({ number, eyebrow, title, subtitle, className = '' }: Props) {
  return (
    <header className={`${styles.sectionHeader} ${className}`}>
      <p className={styles.sectionHeader__eyebrow}>
        <span className={styles.sectionHeader__number}>{number}</span>
        <span className={styles.sectionHeader__divider} />
        <span className={styles.sectionHeader__label}>{eyebrow}</span>
      </p>
      <InteractiveHeading as="h2" className={styles.sectionHeader__title}>
        {title}
      </InteractiveHeading>
      {subtitle && <p className={styles.sectionHeader__subtitle}>{subtitle}</p>}
    </header>
  )
}
