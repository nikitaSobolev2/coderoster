import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { resolveIcon } from '~/shared/components/ui/IconOrImageField/iconMap'
import type { EarnedAchievement } from '~/server/repositories/types'
import styles from './styles.module.scss'

export interface Props {
  achievements: EarnedAchievement[]
}

export default function AchievementsGrid({ achievements }: Props) {
  return (
    <section className={styles.section}>
      <header className={styles.section__head}>
        <h3 className={styles.section__title}>Достижения</h3>
        <span className={styles.section__count}>
          {achievements.filter(a => a.earned).length} / {achievements.length}
        </span>
      </header>
      <ul className={styles.grid}>
        {achievements.map(achievement => (
          <li key={achievement.id}>
            <button
              type="button"
              className={`${styles.tile} ${achievement.earned ? '' : styles.tile_locked}`}
              data-rarity={achievement.rarity}
              title={
                achievement.hidden && !achievement.earned
                  ? 'Скрытое достижение'
                  : `${achievement.name}: ${achievement.description}`
              }
            >
              {achievement.imageUrl ? (
                <img
                  src={achievement.imageUrl}
                  alt=""
                  aria-hidden="true"
                  className={styles.tile__image}
                />
              ) : (
                <FontAwesomeIcon
                  icon={resolveIcon(achievement.icon)}
                  className={styles.tile__icon}
                />
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
