'use client'

import Link from 'next/link'
import { Badge, Button, Loader, Text } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCrown, faLayerGroup } from '@fortawesome/free-solid-svg-icons'
import { api } from '~/trpc/react'
import styles from './styles.module.scss'

export default function PlanCard() {
  const { data: plan, isPending } = api.plan.getMine.useQuery()

  if (isPending) {
    return (
      <div className={styles.card}>
        <Loader size="sm" />
      </div>
    )
  }

  const isPaid = plan && plan.tierLevel > 0

  return (
    <div className={styles.card}>
      <h2 className={styles.card__title}>
        <FontAwesomeIcon icon={faCrown} /> Тариф
      </h2>
      <p className={styles.card__desc}>
        Тариф влияет на доступ к премиум-урокам, бонус XP и инструментам вроде ИИ-разбора кода.
      </p>
      <div className={styles.card__row}>
        {plan ? (
          <>
            <Badge
              size="lg"
              variant="outline"
              color={isPaid ? 'grape' : 'gray'}
              leftSection={<FontAwesomeIcon icon={faLayerGroup} />}
            >
              {plan.name}
            </Badge>
            <Text size="sm" c="dimmed" span>
              +{plan.xpBonusPercent}% XP · уровень {plan.tierLevel}
            </Text>
          </>
        ) : (
          <span className={styles.card__meta}>План не назначен</span>
        )}
      </div>
      <Button component={Link} href="/plans" variant="default">
        Сменить тариф
      </Button>
    </div>
  )
}
