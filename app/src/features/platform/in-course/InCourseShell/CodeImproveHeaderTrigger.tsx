'use client'

import Link from 'next/link'
import { ActionIcon, Anchor, Badge, Button, Stack, Text, Tooltip } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsRotate, faCircleQuestion, faRobot } from '@fortawesome/free-solid-svg-icons'
import styles from './CodeImprovePanel.module.scss'

export type CodeImproveHeaderVariant = 'improve' | 'regenerate'

export interface CodeImproveHeaderTriggerProps {
  attemptIsSuccess: boolean
  hasPaidPlan: boolean
  startBusy: boolean
  onImproveClick: () => void
  disabled: boolean
  variant?: CodeImproveHeaderVariant
}

export default function CodeImproveHeaderTrigger({
  attemptIsSuccess,
  hasPaidPlan,
  startBusy,
  onImproveClick,
  disabled,
  variant = 'improve'
}: CodeImproveHeaderTriggerProps) {
  const isRegenerate = variant === 'regenerate'
  const blockReason = isRegenerate
    ? null
    : !hasPaidPlan
      ? 'premium'
      : !attemptIsSuccess
        ? 'tests'
        : null

  const helpLabel = isRegenerate ? (
    <Stack gap="xs">
      <Text size="sm" c="inherit">
        <strong>Админ:</strong> запускается новая генерация для текущего языка. Тот же job в БД
        сбрасывается в очередь — после ответа модели поля <strong>improvedCode</strong> и{' '}
        <strong>explanationMarkdown</strong> перезаписываются.
      </Text>
    </Stack>
  ) : hasPaidPlan ? (
    <Stack gap="xs">
      <Text size="sm" c="inherit">
        После успешной проверки задачи ИИ анализирует твоё решение и в потоке отдаёт{' '}
        <strong>улучшенный вариант кода</strong> и короткое <strong>пояснение по-русски</strong>.
        Нажми «Улучши код», когда тесты уже зелёные.
      </Text>
      {!attemptIsSuccess ? (
        <Text size="xs" c="dimmed" fs="italic">
          Сейчас кнопка неактивна: сначала пройди все автотесты кнопкой «Проверить».
        </Text>
      ) : null}
    </Stack>
  ) : (
    <Stack gap="xs">
      <Text size="sm" c="inherit">
        Разбор кода с ИИ доступен на <strong>платных тарифах</strong>: модель предлагает аккуратный
        рефакторинг и объясняет идеи под твой уровень.
      </Text>
      <Anchor component={Link} href="/plans" size="sm" fw={500} underline="always">
        Смотреть тарифы →
      </Anchor>
    </Stack>
  )

  return (
    <div className={styles.headerTriggerRow}>
      <Tooltip
        label={
          blockReason === 'premium'
            ? 'Сначала оформи Премиум — тогда откроется запуск разбора.'
            : blockReason === 'tests'
              ? 'Сначала успешно пройди все тесты («Проверить»).'
              : null
        }
        disabled={!blockReason}
        position="bottom"
        withArrow
      >
        <span className={styles.rainbowButtonWrap}>
          {isRegenerate ? (
            <Badge size="xs" variant="filled" color="orange" radius="sm">
              ADMIN
            </Badge>
          ) : (
            <Badge
              className={styles.rainbowProBadge}
              size="xs"
              variant="filled"
              color="grape"
              radius="sm"
            >
              PRO
            </Badge>
          )}
          <Button
            type="button"
            variant="default"
            size="xs"
            radius="md"
            leftSection={
              !startBusy ? (
                <FontAwesomeIcon icon={isRegenerate ? faArrowsRotate : faRobot} />
              ) : undefined
            }
            loading={startBusy}
            disabled={disabled || Boolean(blockReason)}
            onClick={onImproveClick}
            className={styles.rainbowButtonInner}
            loaderProps={{ type: 'oval' }}
          >
            {isRegenerate ? 'Перегенерировать' : 'Улучши код'}
          </Button>
        </span>
      </Tooltip>

      <Tooltip
        label={helpLabel}
        position="bottom"
        withArrow
        multiline
        maw={340}
        events={{ hover: true, focus: true, touch: true }}
      >
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          radius="md"
          aria-label={isRegenerate ? 'Справка по перегенерации' : 'Что даёт ИИ-разбор'}
        >
          <FontAwesomeIcon icon={faCircleQuestion} />
        </ActionIcon>
      </Tooltip>
    </div>
  )
}
