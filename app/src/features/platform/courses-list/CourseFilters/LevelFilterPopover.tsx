'use client'

import { useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { ActionIcon, Button, Checkbox, Group, Popover, Stack, Text } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { COURSE_FILTERS_TOUCH_UI_MEDIA_QUERY } from './courseFiltersConstants'
import { DIFFICULTY_OPTIONS } from './courseFiltersConfig'
import type { CoursesQuery, Difficulty } from '~/server/repositories/types'
import styles from './LevelFilterPopover.module.scss'

export interface Props {
  filters: CoursesQuery
  onApply: (difficulties: Difficulty[] | undefined) => void
  onClear: () => void
}

function summarizeSelection(selected: Difficulty[]): string {
  if (selected.length === 0) return ''
  if (selected.length === DIFFICULTY_OPTIONS.length) return 'Все уровни'
  const labels = selected
    .map(v => DIFFICULTY_OPTIONS.find(o => o.value === v)?.label ?? v)
    .join(', ')
  if (labels.length <= 28) return labels
  if (selected.length === 1) return '1 уровень'
  if (selected.length < 5) return `${selected.length} уровня`
  return `${selected.length} уровней`
}

export default function LevelFilterPopover({ filters, onApply, onClear }: Readonly<Props>) {
  const touchUi = useMediaQuery(COURSE_FILTERS_TOUCH_UI_MEDIA_QUERY)
  const [opened, setOpened] = useState(false)
  const applied = filters.difficulties ?? []
  const isFiltered = applied.length > 0

  const [draft, setDraft] = useState<Difficulty[]>(applied)

  const handleOpenedChange = (next: boolean) => {
    if (next) {
      setDraft([...applied])
    }
    setOpened(next)
  }

  const applyFromDraft = () => {
    onApply(draft.length === 0 ? undefined : draft)
    handleOpenedChange(false)
  }

  return (
    <Popover
      opened={opened}
      onChange={handleOpenedChange}
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
          onClick={() => handleOpenedChange(!opened)}
          aria-expanded={opened}
          aria-haspopup="dialog"
          rightSection={
            isFiltered ? (
              <ActionIcon
                component="span"
                size="sm"
                variant="transparent"
                aria-label="Сбросить уровень"
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
          {isFiltered ? summarizeSelection(applied) : 'Уровень'}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap={touchUi ? 'md' : 'sm'}>
          <Text size="sm" fw={600}>
            Уровень сложности
          </Text>
          <Checkbox.Group value={draft} onChange={v => setDraft(v as Difficulty[])}>
            <Stack gap={touchUi ? 'sm' : 'xs'} className={styles.popoverCheckboxStack}>
              {DIFFICULTY_OPTIONS.map(option => (
                <Checkbox
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  size={touchUi ? 'md' : 'sm'}
                  classNames={{ root: styles.popoverCheckboxRoot }}
                />
              ))}
            </Stack>
          </Checkbox.Group>
          <Group
            justify="flex-end"
            gap={touchUi ? 'sm' : 'xs'}
            wrap="nowrap"
            className={styles.popoverActions}
          >
            <Button
              variant="subtle"
              size={touchUi ? 'sm' : 'xs'}
              onClick={() => handleOpenedChange(false)}
            >
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
