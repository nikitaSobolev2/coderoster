'use client'

import { useState } from 'react'
import { ActionIcon, Badge, Button, Group, Stack, Switch, Textarea, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown, faArrowUp, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import OptionalFieldToggle from '~/features/admin/_shared/OptionalFieldToggle'
import styles from './AutotestList.module.scss'
import type { EditableAutotest, TaskEditorMutations } from './types'

export interface Props {
  taskId: string
  autotests: EditableAutotest[]
  mutations: TaskEditorMutations
}

/**
 * Per-task autotest editor. Each row is collapsible, optional `input` is
 * gated behind a checkbox per the "hide nullable fields" UX rule. The
 * `mutations` object keeps the component decoupled from any specific
 * tRPC router so it serves both course tasks and challenge tasks.
 */
export default function AutotestList({ taskId, autotests, mutations }: Props) {
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    try {
      setCreating(true)
      await mutations.createAutotest({
        taskId,
        name: `Тест ${autotests.length + 1}`,
        expected: ''
      })
      notifications.show({ color: 'teal', message: 'Тест добавлен.' })
    } catch (cause) {
      notifications.show({ color: 'red', message: errorMessage(cause) })
    } finally {
      setCreating(false)
    }
  }

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= autotests.length) return
    const ordered = autotests.map(autotest => autotest.id)
    const [removed] = ordered.splice(index, 1)
    if (!removed) return
    ordered.splice(target, 0, removed)
    try {
      await mutations.reorderAutotests({ taskId, orderedIds: ordered })
    } catch (cause) {
      notifications.show({ color: 'red', message: errorMessage(cause) })
    }
  }

  return (
    <Stack gap="md">
      {autotests.map((autotest, index) => (
        <AutotestRow
          key={autotest.id}
          autotest={autotest}
          index={index}
          total={autotests.length}
          mutations={mutations}
          onMoveUp={() => void move(index, -1)}
          onMoveDown={() => void move(index, 1)}
        />
      ))}
      <Button
        variant="default"
        leftSection={<FontAwesomeIcon icon={faPlus} />}
        loading={creating}
        onClick={handleCreate}
      >
        Добавить тест
      </Button>
    </Stack>
  )
}

interface RowProps {
  autotest: EditableAutotest
  index: number
  total: number
  mutations: TaskEditorMutations
  onMoveUp: () => void
  onMoveDown: () => void
}

function AutotestRow({ autotest, index, total, mutations, onMoveUp, onMoveDown }: RowProps) {
  const [name, setName] = useState(autotest.name)
  const [expected, setExpected] = useState(autotest.expected)
  const [hidden, setHidden] = useState(autotest.hidden)
  const [hasInput, setHasInput] = useState(autotest.input != null)
  const [input, setInput] = useState(autotest.input ?? '')
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  const save = async () => {
    try {
      setSaving(true)
      await mutations.updateAutotest({
        autotestId: autotest.id,
        patch: { name, input: hasInput ? input : null, expected, hidden }
      })
      notifications.show({ color: 'teal', message: 'Тест сохранён.' })
    } catch (cause) {
      notifications.show({ color: 'red', message: errorMessage(cause) })
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm('Удалить тест?')) return
    try {
      setRemoving(true)
      await mutations.deleteAutotest({ autotestId: autotest.id })
      notifications.show({ color: 'teal', message: 'Тест удалён.' })
    } catch (cause) {
      notifications.show({ color: 'red', message: errorMessage(cause) })
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className={styles.row}>
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <Badge variant="light" radius="sm" color="gray">
            #{index + 1}
          </Badge>
          {autotest.hidden ? (
            <Badge variant="outline" radius="sm" color="grape">
              скрытый
            </Badge>
          ) : null}
        </Group>
        <Group gap={4}>
          <ActionIcon variant="subtle" aria-label="Вверх" disabled={index === 0} onClick={onMoveUp}>
            <FontAwesomeIcon icon={faArrowUp} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            aria-label="Вниз"
            disabled={index === total - 1}
            onClick={onMoveDown}
          >
            <FontAwesomeIcon icon={faArrowDown} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            aria-label="Удалить"
            loading={removing}
            onClick={() => void remove()}
          >
            <FontAwesomeIcon icon={faTrash} />
          </ActionIcon>
        </Group>
      </Group>

      <Stack gap="md">
        <TextInput
          label="Название"
          value={name}
          onChange={event => setName(event.currentTarget.value)}
        />
        <OptionalFieldToggle
          label="Этот тест не требует ввода (stdin)"
          hidden={!hasInput}
          onChange={next => setHasInput(!next)}
        >
          <Textarea
            label="stdin"
            value={input}
            onChange={event => setInput(event.currentTarget.value)}
            autosize
            minRows={3}
            maxRows={12}
            styles={{
              input: {
                fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
              }
            }}
          />
        </OptionalFieldToggle>
        <Textarea
          label="Ожидаемый stdout"
          value={expected}
          onChange={event => setExpected(event.currentTarget.value)}
          autosize
          minRows={3}
          maxRows={12}
          styles={{
            input: {
              fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
            }
          }}
        />
        <Switch
          label="Скрытый тест (не показывать ученику ожидание)"
          checked={hidden}
          onChange={event => setHidden(event.currentTarget.checked)}
        />
        <Group justify="flex-end">
          <Button loading={saving} onClick={() => void save()}>
            Сохранить тест
          </Button>
        </Group>
      </Stack>
    </div>
  )
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'Не удалось выполнить операцию.'
}
