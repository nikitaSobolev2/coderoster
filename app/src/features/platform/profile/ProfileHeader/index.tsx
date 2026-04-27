import Link from 'next/link'
import { Avatar, Button, Progress } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendar, faGear } from '@fortawesome/free-solid-svg-icons'
import { faGithub, faLinkedin, faXTwitter } from '@fortawesome/free-brands-svg-icons'
import { faGlobe } from '@fortawesome/free-solid-svg-icons'
import type { PublicProfile } from '~/server/repositories/types'
import StatCards from '../StatCards'
import styles from './styles.module.scss'

export interface Props {
  profile: PublicProfile
}

export default function ProfileHeader({ profile }: Props) {
  const xpPercent = profile.stats.xpForNextLevel
    ? Math.round((profile.stats.xpIntoLevel / profile.stats.xpForNextLevel) * 100)
    : 0

  return (
    <header className={styles.header}>
      <div className={styles.header__cover} aria-hidden="true" />
      <div className={styles.header__inner}>
        <div className={styles.header__identity}>
          <Avatar
            src={profile.avatarUrl ?? undefined}
            alt={profile.displayName}
            size={128}
            radius="50%"
            className={styles.header__avatar}
          >
            {profile.displayName[0]}
          </Avatar>
          <div className={styles.header__identityBody}>
            <span className={styles.header__levelBadge}>Уровень {profile.stats.level}</span>
            <h1 className={styles.header__name}>{profile.displayName}</h1>
            <span className={styles.header__handle}>@{profile.username}</span>
            {profile.bio ? <p className={styles.header__bio}>{profile.bio}</p> : null}
            <div className={styles.header__metaRow}>
              <span className={styles.header__metaItem}>
                <FontAwesomeIcon icon={faCalendar} />с{' '}
                {new Date(profile.joinedAt).toLocaleDateString('ru-RU', {
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
              <ProfileSocials socials={profile.socials} />
            </div>
            {profile.isOwner ? (
              <Button
                component={Link}
                href="/settings"
                variant="default"
                leftSection={<FontAwesomeIcon icon={faGear} />}
                className={styles.header__editButton}
              >
                Редактировать профиль
              </Button>
            ) : null}
          </div>
        </div>

        <div className={styles.header__progress}>
          <div className={styles.header__progressMeta}>
            <span>XP до следующего уровня</span>
            <span>
              {profile.stats.xpIntoLevel} / {profile.stats.xpForNextLevel}
            </span>
          </div>
          <Progress value={xpPercent} radius="xl" color="indigo" size="md" />
        </div>

        <StatCards stats={profile.stats} />
      </div>
    </header>
  )
}

function ProfileSocials({ socials }: { socials: PublicProfile['socials'] }) {
  const links = [
    { href: socials.github, label: 'GitHub', icon: faGithub },
    { href: socials.linkedin, label: 'LinkedIn', icon: faLinkedin },
    { href: socials.x, label: 'X', icon: faXTwitter },
    { href: socials.website, label: 'Site', icon: faGlobe }
  ].filter((link): link is { href: string; label: string; icon: typeof faGithub } =>
    Boolean(link.href)
  )
  if (links.length === 0) return null
  return (
    <span className={styles.socials}>
      {links.map(link => (
        <a
          key={link.label}
          className={styles.socials__link}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          aria-label={link.label}
        >
          <FontAwesomeIcon icon={link.icon} />
        </a>
      ))}
    </span>
  )
}
