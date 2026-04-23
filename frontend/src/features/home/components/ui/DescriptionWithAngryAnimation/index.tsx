import styles from './styles.module.scss'

export interface Props {
  children?: React.ReactNode
  className?: string
}

export default function DescriptionWithAngryAnimation({ children, className }: Props) {
  return <ul className={`${styles.description_with_animation_list} ${className}`}>{children}</ul>
}
