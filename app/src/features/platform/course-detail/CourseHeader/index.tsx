import { Avatar, Badge } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faGraduationCap, faStar, faUsers } from '@fortawesome/free-solid-svg-icons'
import CoursePreview from '~/shared/components/ui/CoursePreview'
import type { CourseDetail } from '~/server/repositories/types'
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
}

export default function CourseHeader({ course }: Props) {
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
        <Badge variant="light" color="indigo" radius="sm">
          {LANGUAGE_LABELS[course.language]}
        </Badge>
        <Badge variant="default" radius="sm">
          {DIFFICULTY_LABELS[course.difficulty]}
        </Badge>
        {course.tags.map(tag => (
          <span key={tag} className={styles.header__tag}>
            #{tag}
          </span>
        ))}
      </div>
      <h1 className={styles.header__title}>{course.title}</h1>
      <p className={styles.header__lead}>{course.description}</p>

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
