import Link from 'next/link'
import { Avatar, Badge, Button } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClock,
  faGraduationCap,
  faPenToSquare,
  faStar,
  faUsers
} from '@fortawesome/free-solid-svg-icons'
import CoursePreview from '~/shared/components/ui/CoursePreview'
import type { CourseDetail } from '~/server/repositories/types'
import { formatPremiumCourseAccessLabel } from '~/shared/lib/premiumLabels'
import styles from './styles.module.scss'

const DIFFICULTY_LABELS: Record<CourseDetail['difficulty'], string> = {
  beginner: 'Новичок',
  intermediate: 'Средний',
  advanced: 'Продвинутый'
}

const LANGUAGE_LABELS: Record<CourseDetail['language'], string> = {
  python: 'Python',
  php: 'PHP'
}

export interface Props {
  course: CourseDetail
  /** True when signed-in user is ADMIN or AUTHOR of this course. */
  canEdit?: boolean
}

export default function CourseHeader({ course, canEdit = false }: Props) {
  return (
    <header className={styles.header}>
      <CoursePreview
        slug={course.slug}
        title={course.title}
        coverImage={course.thumbnail}
        size="hero"
        decorative
      />
      <div className={styles.header__topline}>
        {course.category ? (
          <Link
            href={`/courses?category=${course.category.slug}`}
            className={styles.header__chipLink}
            prefetch={false}
          >
            <Badge variant="light" color="grape" radius="sm">
              {course.category.title}
            </Badge>
          </Link>
        ) : null}
        <Link
          href={`/courses?language=${course.language}`}
          className={styles.header__chipLink}
          prefetch={false}
        >
          <Badge variant="light" color="indigo" radius="sm">
            {LANGUAGE_LABELS[course.language]}
          </Badge>
        </Link>
        <Link
          href={`/courses?difficulty=${course.difficulty}`}
          className={styles.header__chipLink}
          prefetch={false}
        >
          <Badge variant="default" radius="sm">
            {DIFFICULTY_LABELS[course.difficulty]}
          </Badge>
        </Link>
        {course.tierRequired > 0 ? (
          <Badge variant="light" color="grape" radius="sm">
            {formatPremiumCourseAccessLabel(course.tierRequired)}
          </Badge>
        ) : null}
        {course.hasPremiumTasks === true ? (
          <Badge variant="light" color="pink" radius="sm">
            Премиум-задачи
          </Badge>
        ) : null}
        {course.tags.map(tag => (
          <Link
            key={tag}
            href={`/courses?q=${encodeURIComponent(tag)}`}
            className={styles.header__tag}
            prefetch={false}
          >
            #{tag}
          </Link>
        ))}
      </div>
      <h1 className={styles.header__title}>{course.title}</h1>
      <p className={styles.header__lead}>{course.description}</p>

      {canEdit ? (
        <div className={styles.header__editRow}>
          <Button
            component={Link}
            href={`/admin/courses/${course.id}`}
            prefetch={false}
            variant="default"
            radius="md"
            size="sm"
            bd="1px solid light-dark(var(--mantine-color-gray-4), var(--platform-glass-border))"
            leftSection={<FontAwesomeIcon icon={faPenToSquare} />}
          >
            Редактировать курс
          </Button>
        </div>
      ) : null}

      <div className={styles.header__author}>
        <Avatar src={course.author.avatarUrl ?? undefined} radius="xl" size={36}>
          {course.author.displayName[0]}
        </Avatar>
        <div className={styles.header__authorBody}>
          <span className={styles.header__authorName}>{course.author.displayName}</span>
          <span className={styles.header__authorHandle}>@{course.author.username}</span>
        </div>
      </div>

      <ul className={styles.header__meta}>
        <li>
          <FontAwesomeIcon icon={faClock} />
          {course.durationHours} ч
        </li>
        <li>
          <FontAwesomeIcon icon={faGraduationCap} />
          {course.modules.reduce((sum, module) => sum + module.lessons.length, 0)} уроков
        </li>
        <li>
          <FontAwesomeIcon icon={faStar} />+{course.xpReward} XP
        </li>
        <li>
          <FontAwesomeIcon icon={faUsers} />
          {course.enrollmentCount.toLocaleString('ru-RU')} учащихся
        </li>
      </ul>
    </header>
  )
}
