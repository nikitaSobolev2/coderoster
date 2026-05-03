'use client'

import { useEffect, useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { ActionIcon, Button, Group, Popover, Stack, Switch, Text } from '@mantine/core'
import { useAuth } from '@workos-inc/authkit-nextjs/components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import type { CoursesQuery } from '~/server/repositories/types'
import { COURSE_FILTERS_TOUCH_UI_MEDIA_QUERY } from './courseFiltersConfig'
import styles from './LevelFilterPopover.module.scss'

export interface Props {
  filters: CoursesQuery
  onApply: (patch: { freeOnly: boolean | undefined; matchesMyPlan: boolean | undefined }) => void
  onClear: () => void
}

function summarize(filters: CoursesQuery): string {
  const parts: string[] = []
  if (filters.freeOnly) parts.push('Бесплатные')
  if (filters.matchesMyPlan) parts.push('Мой тариф')
  if (parts.length === 0) return ''
  return parts.join(' · ')
}

export default function TierPlanFilterPopover({ filters, onApply, onClear }: Readonly<Props>) {
  const { user } = useAuth()
  const touchUi = useMediaQuery(COURSE_FILTERS_TOUCH_UI_MEDIA_QUERY)
  const [opened, setOpened] = useState(false)
  const appliedSummary = summarize(filters)
  const isFiltered = appliedSummary.length > 0

  const [freeDraft, setFreeDraft] = useState(Boolean(filters.freeOnly))
  const [myPlanDraft, setMyPlanDraft] = useState(Boolean(filters.matchesMyPlan))

  const syncKey = `${filters.freeOnly}-${filters.matchesMyPlan}`

  useEffect(() => {
    if (opened) {
      setFreeDraft(Boolean(filters.freeOnly))
      setMyPlanDraft(Boolean(filters.matchesMyPlan))
    }
  }, [opened, syncKey])

  const applyFromDraft = () => {
    onApply({
      freeOnly: freeDraft ? true : undefined,
      matchesMyPlan: myPlanDraft ? true : undefined
    })
    setOpened(false)
  }

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      shadow="md"
      position="bottom-start"
      classNames={{ dropdown: styles.dropdown }}
      middlewares={{ flip: { fallbackPlacements: ['top-start'] }, shift: { padding: 8 } }}
    >
      <Popover.Target>
        <Button
          variant={isFiltered ? 'light' : 'default'}
          size="md"
          radius="xl"
          className={styles.trigger}
          onClick={() => setOpened(o => !o)}
          aria-expanded={opened}
          aria-haspopup="dialog"
          rightSection={
            isFiltered ? (
              <ActionIcon
                component="span"
                size="sm"
                variant="transparent"
                aria-label="Сбросить фильтр доступа"
                onClick={event => {
                  event.stopPropagation()
                  onClear()
                }}
              >
                <FontAwesomeIcon icon={faXmark} />
              </ActionIcon>
            ) : null
          }
        >
          {isFiltered ? appliedSummary : 'Доступ'}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap={touchUi ? 'md' : 'sm'}>
          <Text size="sm" fw={600}>
            Доступ к курсу
          </Text>
          <Stack gap={touchUi ? 'sm' : 'xs'} className={styles.popoverSwitchStack}>
            <Switch
              label="Только бесплатные"
              checked={freeDraft}
              size={touchUi ? 'md' : 'sm'}
              classNames={{ root: styles.popoverSwitchRoot }}
              onChange={e => setFreeDraft(e.currentTarget.checked)}
            />
            <div>
              <Switch
                label="Подходит для моего тарифа"
                checked={myPlanDraft}
                size={touchUi ? 'md' : 'sm'}
                classNames={{ root: styles.popoverSwitchRoot }}
                onChange={e => setMyPlanDraft(e.currentTarget.checked)}
              />
              <Text size="xs" c="dimmed" mt={touchUi ? 8 : 6}>
                {user
                  ? 'Оставляем курсы, у которых порог не выше твоего текущего плана.'
                  : 'Без входа считается бесплатный план (тир 0). Войди — фильтр начнёт учитывать твою подписку.'}
              </Text>
            </div>
          </Stack>
          <Group
            justify="flex-end"
            gap={touchUi ? 'sm' : 'xs'}
            wrap="nowrap"
            className={styles.popoverActions}
          >
            <Button variant="subtle" size={touchUi ? 'sm' : 'xs'} onClick={() => setOpened(false)}>
              Отмена
            </Button>
            <Button size={touchUi ? 'sm' : 'xs'} onClick={applyFromDraft}>
              ОК
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}
