'use client'

import type { ReactNode } from 'react'
import clsx from 'clsx'
import Link from 'next/link'
import { Badge, Button, Group, Paper, Stack, Text } from '@mantine/core'
import type { inferRouterOutputs } from '@trpc/server'
import Markdown from '~/shared/components/ui/Markdown'
import PlanBulletIcon from '~/shared/plan/PlanBulletIcon'
import type { AppRouter } from '~/server/api/root'
import styles from './styles.module.scss'

type PlanRow = inferRouterOutputs<AppRouter>['plan']['list'][number]

export interface PlanMarketingCardProps {
  plan: PlanRow
  policiesLoaded: boolean
  selfServePaidPlans: boolean
  current: boolean
  loggedIn: boolean
  selectPending: boolean
  onSelect: (planId: string) => void
}

export function PlanMarketingCard({
  plan,
  policiesLoaded,
  selfServePaidPlans,
  current,
  loggedIn,
  selectPending,
  onSelect
}: PlanMarketingCardProps) {
  const paid = plan.tierLevel > 0
  const canSelfServe = policiesLoaded ? selfServePaidPlans !== false : true
  const allowSelect = !paid || canSelfServe
  const hit = plan.isBestseller

  let cta: ReactNode
  if (!loggedIn) {
    cta = (
      <Button
        component={Link}
        href="/login"
        variant="outline"
        className={styles.card__cta}
        fullWidth
        size="md"
      >
        Войти чтобы выбрать
      </Button>
    )
  } else if (current) {
    cta = (
      <Button disabled variant="light" className={styles.card__cta} fullWidth size="md">
        Текущий тариф
      </Button>
    )
  } else if (!allowSelect) {
    cta = (
      <Button disabled variant="outline" className={styles.card__cta} fullWidth size="md">
        Платный только через админа
      </Button>
    )
  } else {
    cta = (
      <Button
        variant={hit ? 'filled' : 'outline'}
        color={hit ? 'gray' : undefined}
        className={clsx(styles.card__cta, hit && styles.card__cta_primary)}
        loading={selectPending}
        onClick={() => onSelect(plan.id)}
        fullWidth
        size="md"
      >
        Выбрать
      </Button>
    )
  }

  return (
    <Paper className={clsx(styles.card, hit && styles.card_hit)} radius="lg" p="xl">
      <Stack gap="lg" className={styles.card__stack}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <div>
            <Text className={styles.card__name}>{plan.name}</Text>
            <Text className={styles.card__slug}>{plan.slug}</Text>
          </div>
          <Group gap={6}>
            {hit ? (
              <Badge variant="outline" color="grape" className={styles.card__pill} size="sm">
                хит
              </Badge>
            ) : null}
            {paid ? (
              <Badge variant="outline" color="gray" className={styles.card__pill} size="sm">
                pro
              </Badge>
            ) : (
              <Badge variant="light" color="gray" size="sm" className={styles.card__pill}>
                free
              </Badge>
            )}
          </Group>
        </Group>

        <div className={styles.card__summary}>
          <Markdown
            source={
              plan.marketingMarkdown?.trim()
                ? plan.marketingMarkdown
                : plan.shortDescription?.trim()
                  ? plan.shortDescription
                  : '_Нет описания._'
            }
            unstyled
          />
        </div>

        {plan.marketingFeatures.length > 0 ? (
          <Stack gap="sm" className={styles.card__features}>
            {plan.marketingFeatures.map((b, idx) => (
              <Group
                key={`${plan.id}-${idx}-${b.text.slice(0, 12)}`}
                gap="sm"
                wrap="nowrap"
                align="flex-start"
              >
                <span className={styles.card__bulletIcon}>
                  <PlanBulletIcon iconKey={b.iconKey} size="md" />
                </span>
                <Text className={styles.card__bulletText}>{b.text}</Text>
              </Group>
            ))}
          </Stack>
        ) : null}

        <Stack gap={6} className={styles.card__meta}>
          <Text size="sm">
            Тир {plan.tierLevel} · +{plan.xpBonusPercent}% XP
          </Text>
          <Text size="sm">Активных курсов: {plan.maxActiveCourses ?? 'без лимита'}</Text>
        </Stack>

        {cta}
      </Stack>
    </Paper>
  )
}
