'use client'

import { Divider, SimpleGrid, Skeleton, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useAuth } from '@workos-inc/authkit-nextjs/components'
import { api } from '~/trpc/react'
import { PlanMarketingCard } from './PlanMarketingCard'
import styles from './styles.module.scss'

function PlansMarketingSkeleton() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <Skeleton height={14} width={120} mb="sm" />
        <Skeleton height={44} width="min(100%, 420px)" mb="sm" />
        <Skeleton height={72} width="min(100%, 640px)" />
      </header>
      <Divider className={styles.sectionRule} />
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {[0, 1, 2].map(i => (
          <Skeleton key={i} height={480} radius="lg" />
        ))}
      </SimpleGrid>
    </div>
  )
}

export default function PlansMarketingPage() {
  const { user } = useAuth()
  const plans = api.plan.list.useQuery()
  const policies = api.plan.policies.useQuery()
  const mine = api.plan.getMine.useQuery(undefined, { enabled: !!user })
  const utils = api.useUtils()
  const select = api.plan.select.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Тариф обновлён.' })
      await utils.plan.getMine.invalidate()
    },
    onError: e => notifications.show({ color: 'red', message: e.message })
  })

  if (plans.isPending && !plans.data) {
    return <PlansMarketingSkeleton />
  }

  if (plans.isError) {
    return (
      <div className={styles.page}>
        <Text c="red">Не удалось загрузить тарифы. Обновите страницу.</Text>
      </div>
    )
  }

  if (!plans.data?.length) {
    return (
      <div className={styles.page}>
        <Text c="dimmed">Тарифы скоро появятся.</Text>
      </div>
    )
  }

  const gridCols = plans.data.length >= 3 ? { base: 1, sm: 2, md: 3 } : { base: 1, sm: 2 }
  const policiesLoaded = !policies.isPending
  const selfServe = policies.data?.selfServePaidPlans ?? true

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.hero__eyebrow}>Тарифы</span>
        <Title order={1} className={styles.hero__title}>
          всё для роста
        </Title>
        <Text className={styles.hero__copy}>
          Сравни лимиты курсов, бонус к XP и доступ к практике. Оформление подписки подключится
          позже — выбор тарифа сейчас зависит от политики сайта.
        </Text>
      </header>

      <Divider
        label={<span className={styles.sectionRule__label}>Сравнение</span>}
        className={styles.sectionRule}
        labelPosition="left"
      />

      <SimpleGrid cols={gridCols} spacing={{ base: 'md', sm: 'lg' }}>
        {plans.data.map(plan => (
          <PlanMarketingCard
            key={plan.id}
            plan={plan}
            policiesLoaded={policiesLoaded}
            selfServePaidPlans={selfServe}
            current={mine.data?.id === plan.id}
            loggedIn={!!user}
            selectPending={select.isPending}
            onSelect={planId => select.mutate({ planId })}
          />
        ))}
      </SimpleGrid>
    </div>
  )
}
