'use client'

import Link from 'next/link'
import { Button, Paper, Stack, Text, Title } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import styles from './styles.module.scss'

export interface Props {
  requiredPlanTier: number
}

export default function LessonTierLockOverlay({ requiredPlanTier }: Readonly<Props>) {
  return (
    <Paper className={styles.panel} radius="md" shadow="sm">
      <Stack align="center" gap="md">
        <FontAwesomeIcon icon={faLock} className={styles.icon} />
        <Title order={3} ta="center" className={styles.title}>
          Урок по тарифу выше
        </Title>
        <Text size="sm" c="dimmed" ta="center" maw={360}>
          Нужен план минимум уровня {requiredPlanTier}. Оформи подписку и вернись — прогресс и
          черновики сохранятся.
        </Text>
        <Button component={Link} href="/plans" variant="default">
          Смотреть тарифы
        </Button>
      </Stack>
    </Paper>
  )
}
