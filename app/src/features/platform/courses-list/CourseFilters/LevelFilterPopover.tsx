'use client'

import { useEffect, useState } from 'react'
import { ActionIcon, Button, Checkbox, Group, Popover, Stack, Text } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
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
  const [opened, setOpened] = useState(false)
  const applied = filters.difficulties ?? []
  const isFiltered = applied.length > 0

  const [draft, setDraft] = useState<Difficulty[]>(applied)

  const appliedKey = [...applied].sort().join('|')

  useEffect(() => {
    if (opened) setDraft([...applied])
  }, [opened, appliedKey])

  const applyFromDraft = () => {
    onApply(draft.length === 0 ? undefined : draft)
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
        <Stack gap="sm">
          <Text size="sm" fw={600}>
            Уровень сложности
          </Text>
          <Checkbox.Group value={draft} onChange={v => setDraft(v as Difficulty[])}>
            <Stack gap="xs">
              {DIFFICULTY_OPTIONS.map(option => (
                <Checkbox key={option.value} value={option.value} label={option.label} />
              ))}
            </Stack>
          </Checkbox.Group>
          <Group justify="flex-end" gap="xs">
            <Button variant="subtle" size="xs" onClick={() => setOpened(false)}>
              Отмена
            </Button>
            <Button size="xs" onClick={applyFromDraft}>
              ОК
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}
