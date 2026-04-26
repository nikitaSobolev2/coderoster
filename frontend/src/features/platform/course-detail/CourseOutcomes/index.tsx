import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import styles from './styles.module.scss'

export interface Props {
  longDescription: string
  outcomes: string[]
}

export default function CourseOutcomes({ longDescription, outcomes }: Props) {
  return (
    <section className={styles.outcomes}>
      <div className={styles.outcomes__about}>
        <h2 className={styles.outcomes__title}>О курсе</h2>
        <p className={styles.outcomes__copy}>{longDescription}</p>
      </div>
      <div className={styles.outcomes__learn}>
        <h2 className={styles.outcomes__title}>Чему научишься</h2>
        <ul className={styles.outcomes__list}>
          {outcomes.map(outcome => (
            <li key={outcome} className={styles.outcomes__item}>
              <FontAwesomeIcon icon={faCircleCheck} className={styles.outcomes__icon} />
              <span>{outcome}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
