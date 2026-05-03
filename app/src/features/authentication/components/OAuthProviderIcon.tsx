import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faApple, faMicrosoft } from '@fortawesome/free-brands-svg-icons'

import GithubOAuthMark from '~/features/authentication/components/GithubOAuthMark'
import GoogleOAuthMark from '~/features/authentication/components/GoogleOAuthMark'

import styles from '~/features/authentication/components/authChrome.module.scss'

export default function OAuthProviderIcon({
  providerKey,
  className = ''
}: Readonly<{
  providerKey: string
  /** Extra class on wrapper span for alignment */
  className?: string
}>) {
  const key = providerKey.toLowerCase()

  switch (key) {
    case 'github':
      return (
        <span className={`${styles.oauthIconWrap} ${className}`}>
          <GithubOAuthMark className={styles.oauthSvgGithub} />
        </span>
      )
    case 'google':
      return (
        <span className={`${styles.oauthIconWrap} ${className}`}>
          <GoogleOAuthMark className={styles.oauthSvgGoogle} />
        </span>
      )
    case 'microsoft':
      return (
        <span className={`${styles.oauthIconWrap} ${className}`}>
          <FontAwesomeIcon icon={faMicrosoft} className={styles.oauthFa} />
        </span>
      )
    case 'apple':
      return (
        <span className={`${styles.oauthIconWrap} ${className}`}>
          <FontAwesomeIcon icon={faApple} className={styles.oauthFa} />
        </span>
      )
    default:
      return null
  }
}
