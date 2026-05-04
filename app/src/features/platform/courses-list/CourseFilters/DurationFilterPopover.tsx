'use client'

import { useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { ActionIcon, Button, Group, Popover, RangeSlider, Stack, Text } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { COURSE_FILTERS_TOUCH_UI_MEDIA_QUERY, DURATION_BOUNDS } from './courseFiltersConfig'
import type { CoursesQuery } from '~/server/repositories/types'
import styles from './DurationFilterPopover.module.scss'

export interface Props {
  filters: CoursesQuery
  onApply: (durationMin: number | undefined, durationMax: number | undefined) => void
  onClear: () => void
}

export default function DurationFilterPopover({ filters, onApply, onClear }: Readonly<Props>) {
  const touchUi = useMediaQuery(COURSE_FILTERS_TOUCH_UI_MEDIA_QUERY)
  const [opened, setOpened] = useState(false)
  const appliedRange: [number, number] = [
    filters.durationMin ?? DURATION_BOUNDS[0],
    filters.durationMax ?? DURATION_BOUNDS[1]
  ]
  const isFiltered = filters.durationMin !== undefined || filters.durationMax !== undefined

  const [draft, setDraft] = useState<[number, number]>(appliedRange)

  const handleOpenedChange = (next: boolean) => {
    if (next) {
      setDraft(appliedRange)
    }
    setOpened(next)
  }

  const applyFromDraft = () => {
    const [min, max] = draft
    onApply(
      min === DURATION_BOUNDS[0] ? undefined : min,
      max === DURATION_BOUNDS[1] ? undefined : max
    )
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
                aria-label="Сбросить длительность"
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
          {isFiltered ? `${appliedRange[0]}—${appliedRange[1]} ч` : 'Длительность'}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap={touchUi ? 'md' : 'sm'}>
          <Text size="sm" fw={600}>
            Длительность, ч
          </Text>
          <div className={styles.sliderBlock}>
            <RangeSlider
              size={touchUi ? 'md' : 'sm'}
              min={DURATION_BOUNDS[0]}
              max={DURATION_BOUNDS[1]}
              step={1}
              minRange={1}
              value={draft}
              onChange={setDraft}
              marks={[
                { value: 0, label: '0' },
                { value: 25, label: '25' },
                { value: 50, label: '50' }
              ]}
            />
          </div>
          <Group
            justify="flex-end"
            gap={touchUi ? 'sm' : 'xs'}
            wrap="nowrap"
            className={styles.actionsRow}
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
