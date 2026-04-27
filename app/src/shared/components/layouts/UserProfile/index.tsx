'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { faArrowRight, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '@workos-inc/authkit-nextjs/components'
import styles from './styles.module.scss'

export interface Props {
  className?: string
}

export default function UserProfile({ className = '' }: Props) {
  const platformRef = useRef<HTMLAnchorElement>(null)
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

  return (
    <div className={`${styles.userProfile} ${className}`}>
      <Link ref={platformRef} href="/courses" className={styles.userProfile__platform}>
        <span>Платформа</span>
        <FontAwesomeIcon icon={faArrowRight} />
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        aria-label="Выйти"
        className={styles.userProfile__signOut}
      >
        <FontAwesomeIcon icon={faRightFromBracket} />
      </button>
    </div>
  )
}
