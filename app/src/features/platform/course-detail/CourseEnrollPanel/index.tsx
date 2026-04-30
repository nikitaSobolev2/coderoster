'use client'

import { useRouter } from 'next/navigation'
import { Button, Modal, Progress, Skeleton, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRightToBracket,
  faCircleCheck,
  faPlay,
  faRotateRight,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons'
import { api } from '~/trpc/react'
import type { CourseDetail } from '~/server/repositories/types'
import { formatPremiumCourseAccessLabel } from '~/shared/lib/premiumLabels'
import styles from './styles.module.scss'

export interface Props {
  course: CourseDetail
  isAuthenticated: boolean
}

/**
 * Sticky right rail on the course detail page. Pure orchestration —
 * delegates network access to tRPC mutations and queries; visuals only.
 */
export default function CourseEnrollPanel({ course, isAuthenticated }: Props) {
  const router = useRouter()
  const utils = api.useUtils()
  const enrollmentQuery = api.enrollment.getMine.useQuery(
    { courseSlug: course.slug },
    { enabled: isAuthenticated }
  )
  const planQuery = api.plan.getMine.useQuery(undefined, { enabled: isAuthenticated, staleTime: 60_000 })
  const viewerTier = planQuery.data?.tierLevel ?? 0
  const tierLocked = course.tierRequired > viewerTier
  const premiumLabel = formatPremiumCourseAccessLabel(course.tierRequired)
  const startMutation = api.enrollment.start.useMutation({
    onSuccess: async () => {
      await utils.enrollment.getMine.invalidate({ courseSlug: course.slug })
    }
  })
  const abandonMutation = api.enrollment.abandon.useMutation({
    onSuccess: async () => {
      await utils.enrollment.getMine.invalidate({ courseSlug: course.slug })
    }
  })
  const [confirmOpened, confirmHandlers] = useDisclosure(false)

  const enrollment = enrollmentQuery.data ?? null
  const firstLessonId = course.modules[0]?.lessons[0]?.id ?? null

  if (!isAuthenticated) {
    return (
      <aside className={styles.panel}>
        <h3 className={styles.panel__title}>Готов начать?</h3>
        <p className={styles.panel__copy}>
          Войди, чтобы записаться, отслеживать прогресс и получать XP за решения.
        </p>
        <Button
          component="a"
          href="/login"
          fullWidth
          leftSection={<FontAwesomeIcon icon={faArrowRightToBracket} />}
        >
          Войти и начать
        </Button>
      </aside>
    )
  }

  if (enrollmentQuery.isPending || planQuery.isPending) {
    return (
      <aside className={styles.panel} aria-busy="true">
        <Skeleton height={24} width="60%" radius="sm" />
        <Skeleton height={14} radius="sm" />
        <Skeleton height={14} radius="sm" width="80%" />
        <Skeleton height={40} radius="md" mt="xs" />
        <Skeleton height={36} radius="md" />
      </aside>
    )
  }

  if (!enrollment || enrollment.status === 'abandoned') {
    return (
      <aside className={styles.panel}>
        <h3 className={styles.panel__title}>Записаться на курс</h3>
        {tierLocked ? (
          <>
            <Text size="sm" c="dimmed" mb="md">
              Этот курс — {premiumLabel}. Для записи нужен подходящий план (см. тарифы).
            </Text>
            <Button
              component="a"
              href="/plans"
              fullWidth
              variant="light"
              color="grape"
              leftSection={<FontAwesomeIcon icon={faPlay} />}
            >
              Смотреть тарифы
            </Button>
          </>
        ) : (
          <>
            <p className={styles.panel__copy}>
              Все уроки откроются сразу. Прогресс сохраняется автоматически.
            </p>
            <Button
              fullWidth
              leftSection={<FontAwesomeIcon icon={faPlay} />}
              loading={startMutation.isPending}
              onClick={async () => {
                const result = await startMutation.mutateAsync({ courseSlug: course.slug })
                notifications.show({ color: 'green', message: 'Записал. Удачи на курсе.' })
                if (firstLessonId) {
                  router.push(`/learn/${course.slug}/${result.currentLessonId ?? firstLessonId}`)
                }
              }}
            >
              Начать сейчас
            </Button>
          </>
        )}
      </aside>
    )
  }

  if (tierLocked) {
    return (
      <aside className={styles.panel}>
        <h3 className={styles.panel__title}>Нужен Премиум</h3>
        <Text size="sm" c="dimmed" mb="md">
          Продолжать этот курс можно с {premiumLabel}. Сейчас план не подходит — обнови подписку.
        </Text>
        <Button
          component="a"
          href="/plans"
          fullWidth
          variant="light"
          color="grape"
          leftSection={<FontAwesomeIcon icon={faPlay} />}
        >
          Смотреть тарифы
        </Button>
      </aside>
    )
  }

  if (enrollment.status === 'finished') {
    return (
      <aside className={styles.panel}>
        <div className={styles.panel__doneBadge}>
          <FontAwesomeIcon icon={faCircleCheck} />
          Курс завершён
        </div>
        <p className={styles.panel__copy}>
          Завершён{' '}
          {enrollment.finishedAt
            ? new Date(enrollment.finishedAt).toLocaleDateString('ru-RU')
            : '—'}
        </p>
        {firstLessonId ? (
          <Button
            component="a"
            href={`/learn/${course.slug}/${firstLessonId}`}
            variant="default"
            fullWidth
          >
            Перепройти
          </Button>
        ) : null}
        <Button
          variant="subtle"
          fullWidth
          leftSection={<FontAwesomeIcon icon={faRotateRight} />}
          loading={startMutation.isPending}
          onClick={() => startMutation.mutate({ courseSlug: course.slug })}
        >
          Сбросить прогресс
        </Button>
      </aside>
    )
  }

  return (
    <aside className={styles.panel}>
      <h3 className={styles.panel__title}>Продолжить</h3>
      <Progress value={enrollment.progressPercent} radius="xl" size="md" color="indigo" />
      <span className={styles.panel__progressLabel}>Пройдено {enrollment.progressPercent}%</span>
      <Button
        component="a"
        href={`/learn/${course.slug}/${enrollment.currentLessonId ?? firstLessonId ?? ''}`}
        fullWidth
        leftSection={<FontAwesomeIcon icon={faPlay} />}
      >
        Продолжить
      </Button>
      <Button
        variant="subtle"
        color="red"
        fullWidth
        leftSection={<FontAwesomeIcon icon={faTriangleExclamation} />}
        onClick={confirmHandlers.open}
      >
        Бросить курс
      </Button>

      <Modal opened={confirmOpened} onClose={confirmHandlers.close} title="Бросить курс?" centered>
        <p className={styles.panel__copy}>
          Прогресс сохранится, но курс перестанет числиться активным. Вернуться можно в любой
          момент.
        </p>
        <div className={styles.panel__confirmActions}>
          <Button variant="default" onClick={confirmHandlers.close}>
            Отмена
          </Button>
          <Button
            color="red"
            loading={abandonMutation.isPending}
            onClick={async () => {
              await abandonMutation.mutateAsync({ courseSlug: course.slug })
              confirmHandlers.close()
              notifications.show({ color: 'gray', message: 'Курс перенесён в архив.' })
            }}
          >
            Бросить
          </Button>
        </div>
      </Modal>
    </aside>
  )
}
