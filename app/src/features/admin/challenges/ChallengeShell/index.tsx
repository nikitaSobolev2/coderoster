'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { ActionIcon, Button, Stack, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown, faArrowUp, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import AdminCard from '~/features/admin/_shared/AdminCard'
import {
  TaskEditor,
  type EditableTask,
  type TaskEditorMutations
} from '~/features/admin/_shared/task-editor'
import styles from './styles.module.scss'

export interface ChallengeShellHeaderInfo {
  title: string
  subtitle: string
}

export interface ChallengeShellProps {
  /** Challenge id (daily/weekly). Drives mutations targeting the right owner. */
  challengeId: string
  header: ChallengeShellHeaderInfo
  tasks: EditableTask[]
  languageOptions: string[]
  taskMutations: TaskEditorMutations
  /**
   * Add a new empty task to the challenge. Returns the new task id so the
   * shell can auto-select it (mirrors the course editor flow where a fresh
   * task is selected immediately for inline editing).
   */
  onCreateTask: (title: string) => Promise<string>
  /** Reorder tasks; receives ordered task ids (must mirror final state). */
  onReorderTasks: (orderedIds: string[]) => Promise<void>
  /** Delete the challenge entirely. */
  onDeleteTask: (taskId: string) => Promise<void>
  isCreatingTask: boolean
}

/**
 * Two-pane shell for a single challenge — left list of owned tasks (with
 * up/down reorder + delete), center pane reuses the shared `TaskEditor`.
 * Mirrors the course editor experience so admins keep one mental model.
 */
export default function ChallengeShell(props: ChallengeShellProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(props.tasks[0]?.id ?? null)

  const effectiveSelection =
    props.tasks.find(task => task.id === selectedTaskId)?.id ?? props.tasks[0]?.id ?? null

  return (
    <div className={styles.shell}>
      <div className={styles.shell__tree}>
        <AdminCard title={props.header.title} description={props.header.subtitle}>
          <ChallengeTaskTree
            tasks={props.tasks}
            selectedTaskId={effectiveSelection}
            onSelect={setSelectedTaskId}
            onMove={async (taskId, direction) => {
              const ordered = props.tasks.map(task => task.id)
              const index = ordered.indexOf(taskId)
              const target = index + direction
              if (index === -1 || target < 0 || target >= ordered.length) return
              const [removed] = ordered.splice(index, 1)
              if (!removed) return
              ordered.splice(target, 0, removed)
              try {
                await props.onReorderTasks(ordered)
              } catch (cause) {
                notifications.show({ color: 'red', message: errorMessage(cause) })
              }
            }}
            onDelete={async taskId => {
              if (!confirm('Удалить задачу из этого спидрана?')) return
              try {
                await props.onDeleteTask(taskId)
                if (selectedTaskId === taskId) setSelectedTaskId(null)
              } catch (cause) {
                notifications.show({ color: 'red', message: errorMessage(cause) })
              }
            }}
            onCreate={async () => {
              try {
                const newId = await props.onCreateTask('Новая задача')
                setSelectedTaskId(newId)
              } catch (cause) {
                notifications.show({ color: 'red', message: errorMessage(cause) })
              }
            }}
            isCreating={props.isCreatingTask}
          />
        </AdminCard>
      </div>

      <div className={styles.shell__form}>
        {effectiveSelection ? (
          <TaskEditor
            key={effectiveSelection}
            task={props.tasks.find(task => task.id === effectiveSelection)!}
            languageOptions={props.languageOptions}
            mutations={props.taskMutations}
          />
        ) : (
          <AdminCard
            title="Задачи"
            description="Добавь первую задачу в спидран — она появится здесь со всем редактором."
          >
            <Text size="sm" c="dimmed">
              Пока нет задач. Используй «Добавить задачу» слева.
            </Text>
          </AdminCard>
        )}
      </div>
    </div>
  )
}

interface TreeProps {
  tasks: EditableTask[]
  selectedTaskId: string | null
  onSelect: (taskId: string) => void
  onMove: (taskId: string, direction: -1 | 1) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
  onCreate: () => Promise<void>
  isCreating: boolean
}

function ChallengeTaskTree({
  tasks,
  selectedTaskId,
  onSelect,
  onMove,
  onDelete,
  onCreate,
  isCreating
}: TreeProps) {
  return (
    <Stack gap="xs">
      <div className={styles.tree}>
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={clsx(
              styles.tree__row,
              selectedTaskId === task.id && styles.tree__row_active
            )}
            onClick={() => onSelect(task.id)}
          >
            <div className={styles.tree__rowMain}>
              <span className={styles.tree__rowTitle}>{task.title || 'Без названия'}</span>
              <span className={styles.tree__rowSub}>
                #{index + 1} • {task.kind.toLowerCase()}
              </span>
            </div>
            <ActionIcon
              variant="subtle"
              size="sm"
              aria-label="Вверх"
              disabled={index === 0}
              onClick={event => {
                event.stopPropagation()
                void onMove(task.id, -1)
              }}
            >
              <FontAwesomeIcon icon={faArrowUp} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="sm"
              aria-label="Вниз"
              disabled={index === tasks.length - 1}
              onClick={event => {
                event.stopPropagation()
                void onMove(task.id, 1)
              }}
            >
              <FontAwesomeIcon icon={faArrowDown} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="sm"
              color="red"
              aria-label="Удалить"
              onClick={event => {
                event.stopPropagation()
                void onDelete(task.id)
              }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </ActionIcon>
          </div>
        ))}
      </div>
      <Button
        variant="default"
        leftSection={<FontAwesomeIcon icon={faPlus} />}
        loading={isCreating}
        onClick={() => void onCreate()}
        className={styles.tree__add}
      >
        Добавить задачу
      </Button>
    </Stack>
  )
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'Не удалось выполнить операцию.'
}
