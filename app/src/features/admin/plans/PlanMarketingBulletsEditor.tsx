'use client'

import {
  ActionIcon,
  Button,
  Group,
  NativeSelect,
  Stack,
  Text,
  TextInput
} from '@mantine/core'
import { faChevronDown, faChevronUp, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import PlanBulletIcon from '~/shared/plan/PlanBulletIcon'
import {
  PLAN_MARKETING_BULLET_ICON_KEYS,
  type PlanMarketingBullet
} from '~/shared/plan/planMarketing'

const ICON_LABELS: Record<string, string> = {
  check: 'Галочка',
  star: 'Звезда',
  bolt: 'Молния',
  sparkles: 'Блёстки',
  wand: 'Магия',
  code: 'Код',
  shield: 'Щит',
  rocket: 'Ракета',
  gift: 'Подарок',
  infinity: 'Бесконечность'
}

export interface PlanMarketingBulletsEditorProps {
  value: PlanMarketingBullet[]
  onChange: (next: PlanMarketingBullet[]) => void
}

export default function PlanMarketingBulletsEditor({ value, onChange }: PlanMarketingBulletsEditorProps) {
  const move = (index: number, direction: -1 | 1) => {
    const next = [...value]
    const j = index + direction
    if (j < 0 || j >= next.length) return
    const t = next[index]!
    next[index] = next[j]!
    next[j] = t
    onChange(next)
  }

  const updateRow = (index: number, patch: Partial<PlanMarketingBullet>) => {
    const next = value.map((row, i) => (i === index ? { ...row, ...patch } : row))
    onChange(next)
  }

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const push = () => {
    onChange([...value, { iconKey: 'check', text: '' }])
  }

  return (
    <Stack gap="sm">
      <Text size="sm" fw={600}>
        Буллеты на странице тарифов
      </Text>
      <Text size="xs" c="dimmed">
        Порядок = порядок на сайте. Иконка — превью слева.
      </Text>
      <Stack gap="xs">
        {value.map((row, idx) => (
          <Group key={`${idx}-${row.text.slice(0, 8)}`} wrap="nowrap" align="flex-start" gap="xs">
            <ActionIcon
              variant="light"
              aria-label="Выше"
              disabled={idx === 0}
              onClick={() => move(idx, -1)}
            >
              <FontAwesomeIcon icon={faChevronUp} />
            </ActionIcon>
            <ActionIcon
              variant="light"
              aria-label="Ниже"
              disabled={idx === value.length - 1}
              onClick={() => move(idx, 1)}
            >
              <FontAwesomeIcon icon={faChevronDown} />
            </ActionIcon>
            <Group gap={6} wrap="nowrap">
              <PlanBulletIcon iconKey={row.iconKey as PlanMarketingBullet['iconKey']} size="md" />
              <NativeSelect
                w={200}
                aria-label="Иконка"
                value={row.iconKey}
                onChange={e =>
                  updateRow(idx, { iconKey: e.currentTarget.value as PlanMarketingBullet['iconKey'] })
                }
                data={PLAN_MARKETING_BULLET_ICON_KEYS.map(k => ({
                  value: k,
                  label: `${ICON_LABELS[k] ?? k}`
                }))}
              />
            </Group>
            <TextInput
              placeholder="Текст пункта"
              style={{ flex: 1 }}
              value={row.text}
              onChange={e => updateRow(idx, { text: e.currentTarget.value })}
            />
            <ActionIcon
              color="red"
              variant="light"
              aria-label="Удалить"
              onClick={() => remove(idx)}
            >
              <FontAwesomeIcon icon={faTrash} />
            </ActionIcon>
          </Group>
        ))}
      </Stack>
      <div>
        <Button leftSection={<FontAwesomeIcon icon={faPlus} />} variant="light" size="xs" onClick={push}>
          Добавить пункт
        </Button>
      </div>
    </Stack>
  )
}
