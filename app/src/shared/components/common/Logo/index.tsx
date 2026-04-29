import styles from './styles.module.scss'

import { SITE_NAME } from '~/shared/constants/site'

export interface Props {
  className?: string
  wordmarkClassName?: string
  withWordmark?: boolean
}

export default function Logo({
  className = '',
  wordmarkClassName = '',
  withWordmark = true
}: Props) {
  return (
    <span className={`${styles.logo} ${className}`} aria-label={SITE_NAME}>
      <LogoMark className={styles.logo__mark} />
      {withWordmark && (
        <span className={`${styles.logo__wordmark} ${wordmarkClassName}`}>{SITE_NAME}</span>
      )}
    </span>
  )
}

function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.25" />
      <ellipse cx="16" cy="16" rx="14" ry="6" stroke="currentColor" strokeWidth="1.25" />
      <ellipse cx="16" cy="16" rx="6" ry="14" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M9 12l-3 4 3 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 12l3 4-3 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="14"
        y1="22"
        x2="18"
        y2="10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
