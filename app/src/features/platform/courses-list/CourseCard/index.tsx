import Link from 'next/link'
import { Badge, Button } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faStar, faUsers } from '@fortawesome/free-solid-svg-icons'
import CoursePreview from '~/shared/components/ui/CoursePreview'
import type { CourseSummary } from '~/server/repositories/types'
import {
  formatPremiumCourseAccessLabel
} from '~/shared/lib/premiumLabels'
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

function PremiumCatalogChips({ course }: { course: CourseSummary }) {
  const premiumTasks = course.hasPremiumTasks === true
  if (course.tierRequired <= 0 && !premiumTasks) return null
  return (
    <>
      {course.tierRequired > 0 ? (
        <Badge variant="outline" color="grape" radius="sm">
          {formatPremiumCourseAccessLabel(course.tierRequired)}
        </Badge>
      ) : null}
      {premiumTasks ? (
        <Badge variant="outline" color="pink" radius="sm">
          Премиум-задачи
        </Badge>
      ) : null}
    </>
  )
}

export type CourseCardVariant = 'compact' | 'comfortable' | 'list'

export interface Props {
  course: CourseSummary
  variant?: CourseCardVariant
}

export default function CourseCard({ course, variant = 'comfortable' }: Props) {
  if (variant === 'compact') {
    return (
      <article className={`${styles.card} ${styles.card_compact}`}>
        <div className={styles.cardCompact__preview}>
          <CoursePreview
            slug={course.slug}
            title={course.title}
            coverImage={course.thumbnail}
            size="card"
            decorative
          />
        </div>
        <div className={styles.cardCompact__body}>
          <h3 className={styles.cardCompact__title}>
            <Link
              href={`/courses/${course.slug}`}
              className={styles.cardCompact__titleLink}
              prefetch={false}
            >
              {course.title}
            </Link>
          </h3>
          <div className={styles.cardCompact__chips}>
            <PremiumCatalogChips course={course} />
          </div>
          <Button
            component={Link}
            href={`/courses/${course.slug}`}
            prefetch={false}
            variant="light"
            size="xs"
            radius="xl"
            fullWidth
            className={styles.cardCompact__cta}
          >
            Узнать больше
          </Button>
        </div>
      </article>
    )
  }

  if (variant === 'list') {
    return (
      <article className={`${styles.card} ${styles.card_list}`}>
        <div className={styles.cardList__media}>
          <CoursePreview
            slug={course.slug}
            title={course.title}
            coverImage={course.thumbnail}
            size="card"
            decorative
          />
        </div>
        <div className={styles.cardList__content}>
          <header className={styles.cardList__head}>
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
              <PremiumCatalogChips course={course} />
            </div>
            <h3 className={styles.cardList__title}>{course.title}</h3>
            {course.shortSummary.trim() ? (
              <p className={styles.cardList__teaser}>{course.shortSummary}</p>
            ) : null}
            <p className={styles.cardList__summary}>{course.description}</p>
          </header>
          <ul className={styles.card__tags}>
            {course.tags.slice(0, 6).map(tag => (
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
          <div className={styles.cardList__stats}>
            <Stat icon={faClock} label={`${course.durationHours} ч`} />
            <Stat icon={faStar} label={`+${course.xpReward} XP`} />
            <Stat icon={faUsers} label={course.enrollmentCount.toLocaleString('ru-RU')} />
            <Link
              href={`/u/${course.author.username}`}
              className={styles.cardList__authorLink}
              prefetch={false}
            >
              {course.author.displayName}
            </Link>
          </div>
          <div className={styles.cardList__actions}>
            <Button
              component={Link}
              href={`/courses/${course.slug}`}
              prefetch={false}
              variant="default"
              radius="xl"
            >
              Узнать больше
            </Button>
            <Button
              component={Link}
              href={`/courses/${course.slug}#course-enroll`}
              prefetch={false}
              variant="filled"
              radius="xl"
            >
              Погрузиться в курс
            </Button>
          </div>
        </div>
      </article>
    )
  }

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
              <PremiumCatalogChips course={course} />
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
      <div className={styles.cardComfortable__ctaWrap}>
        <Button
          component={Link}
          href={`/courses/${course.slug}`}
          prefetch={false}
          variant="light"
          size="sm"
          radius="xl"
          fullWidth
          className={styles.cardComfortable__cta}
        >
          Узнать больше
        </Button>
      </div>
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
