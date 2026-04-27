'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { faArrowRight, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '@workos-inc/authkit-nextjs/components'
import { useCursorFillTarget } from '~/features/home/hooks/useCursorFillTarget'
import styles from './styles.module.scss'

export type UserProfileLayout = 'inline' | 'drawer'

export interface Props {
  className?: string
  layout?: UserProfileLayout
}

export default function UserProfile({ className = '', layout = 'inline' }: Props) {
  const platformRef = useRef<HTMLAnchorElement>(null)
  const signOutRef = useRef<HTMLButtonElement>(null)
  useCursorFillTarget(platformRef)
  useCursorFillTarget(signOutRef)

  const { signOut } = useAuth()
  const [isPending, setIsPending] = useState(false)

  const handleSignOut = async () => {
    if (isPending) return
    setIsPending(true)
    try {
      await signOut()
    } finally {
      setIsPending(false)
    }
  }

  const layoutClass = layout === 'drawer' ? styles.userProfile_drawer : styles.userProfile_inline

  return (
    <div className={`${styles.userProfile} ${layoutClass} ${className}`.trim()}>
      <Link
        ref={platformRef}
        href="/courses"
        className={styles.userProfile__platform}
        aria-label="Платформа"
      >
        <span className={styles.userProfile__platformLabel}>Платформа</span>
        <FontAwesomeIcon
          icon={faArrowRight}
          className={styles.userProfile__platformIcon}
          aria-hidden
        />
      </Link>
      <button
        ref={signOutRef}
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        aria-label="Выйти"
        className={styles.userProfile__signOut}
      >
        <FontAwesomeIcon icon={faRightFromBracket} aria-hidden />
        <span className={styles.userProfile__signOutLabel}>Выйти</span>
      </button>
    </div>
  )
}
