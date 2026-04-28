import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faStar, faUsers } from '@fortawesome/free-solid-svg-icons'
import { Badge } from '@mantine/core'
import CoursePreview from '~/shared/components/ui/CoursePreview'
import type { CourseSummary } from '~/server/repositories/types'
import styles from './styles.module.scss'

const DIFFICULTY_LABELS: Record<CourseSummary['difficulty'], string> = {
  beginner: 'Новичок',
  intermediate: 'Средний',
  advanced: 'Продвинутый'
}

const LANGUAGE_LABELS: Record<CourseSummary['language'], string> = {
  python: 'Python',
  php: 'PHP'
}

export interface Props {
  course: CourseSummary
}

/**
 * Course summary card. The whole tile is clickable via an overlay anchor on
 * the title (`::before`), while category + tag chips render as nested anchors
 * pointing at pre-filtered catalog routes — they sit above the overlay so a
 * tap on a chip drives a tag-filtered list rather than the course detail.
 */
export default function CourseCard({ course }: Props) {
  return (
    <article className={styles.card}>
      <CoursePreview
        slug={course.slug}
        title={course.title}
        coverImage={course.thumbnail}
        size="card"
        decorative
      />
      <header className={styles.card__head}>
        <div className={styles.card__badges}>
          {course.category ? (
            <Link
              href={`/courses?category=${course.category.slug}`}
              className={styles.card__chipLink}
              prefetch={false}
            >
              <Badge variant="light" color="grape" radius="sm">
                {course.category.title}
              </Badge>
            </Link>
          ) : null}
          <Link
            href={`/courses?language=${course.language}`}
            className={styles.card__chipLink}
            prefetch={false}
          >
            <Badge variant="light" color="indigo" radius="sm">
              {LANGUAGE_LABELS[course.language]}
            </Badge>
          </Link>
          <Link
            href={`/courses?difficulty=${course.difficulty}`}
            className={styles.card__chipLink}
            prefetch={false}
          >
            <Badge variant="default" radius="sm">
              {DIFFICULTY_LABELS[course.difficulty]}
            </Badge>
          </Link>
        </div>
        <h3 className={styles.card__title}>
          <Link
            href={`/courses/${course.slug}`}
            className={styles.card__titleLink}
            prefetch={false}
          >
            {course.title}
          </Link>
        </h3>
        <p className={styles.card__description}>{course.description}</p>
      </header>

      <ul className={styles.card__tags}>
        {course.tags.slice(0, 4).map(tag => (
          <li key={tag}>
            <Link
              href={`/courses?q=${encodeURIComponent(tag)}`}
              className={styles.card__tag}
              prefetch={false}
            >
              #{tag}
            </Link>
          </li>
        ))}
      </ul>

      <footer className={styles.card__foot}>
        <Stat icon={faClock} label={`${course.durationHours} ч`} />
        <Stat icon={faStar} label={`+${course.xpReward} XP`} />
        <Stat icon={faUsers} label={course.enrollmentCount.toLocaleString('ru-RU')} />
      </footer>
    </article>
  )
}

function Stat({
  icon,
  label
}: {
  icon: Parameters<typeof FontAwesomeIcon>[0]['icon']
  label: string
}) {
  return (
    <span className={styles.stat}>
      <FontAwesomeIcon icon={icon} className={styles.stat__icon} />
      {label}
    </span>
  )
}
