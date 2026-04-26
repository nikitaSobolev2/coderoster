import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faShoePrints,
  faFire,
  faCircleCheck,
  faBolt,
  faMoon,
  faTrophy
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import type { EarnedAchievement } from '~/server/repositories/types'
import styles from './styles.module.scss'

const ICON_BY_NAME: Record<string, IconDefinition> = {
  'shoe-prints': faShoePrints,
  fire: faFire,
  'circle-check': faCircleCheck,
  bolt: faBolt,
  moon: faMoon,
  trophy: faTrophy
}

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
              <FontAwesomeIcon
                icon={ICON_BY_NAME[achievement.icon] ?? faTrophy}
                className={styles.tile__icon}
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
