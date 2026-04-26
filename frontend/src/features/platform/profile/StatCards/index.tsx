import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBookOpenReader, faCircleCheck, faFire, faStar } from '@fortawesome/free-solid-svg-icons'
import type { ProfileStats } from '~/server/repositories/types'
import styles from './styles.module.scss'

export interface Props {
  stats: ProfileStats
}

export default function StatCards({ stats }: Props) {
  const cards = [
    { label: 'XP всего', value: stats.totalXp.toLocaleString('ru-RU'), icon: faStar },
    { label: 'Серия', value: `${stats.streakDays} дн.`, icon: faFire },
    {
      label: 'Курсов завершено',
      value: stats.coursesCompleted.toString(),
      icon: faCircleCheck
    },
    { label: 'Задач решено', value: stats.tasksSolved.toString(), icon: faBookOpenReader }
  ]
  return (
    <ul className={styles.cards}>
      {cards.map(card => (
        <li key={card.label} className={styles.card}>
          <FontAwesomeIcon icon={card.icon} className={styles.card__icon} />
          <div className={styles.card__body}>
            <span className={styles.card__value}>{card.value}</span>
            <span className={styles.card__label}>{card.label}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
