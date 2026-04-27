'use client'

import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Menu,
  Modal,
  Stack,
  Text,
  TextInput
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowDown,
  faArrowUp,
  faChevronRight,
  faEllipsisVertical,
  faGraduationCap,
  faPlus,
  faTrash
} from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'
import type { CourseTree as CourseTreeShape } from '../CourseEditorShell'
import type { EditorSelection } from '../CourseEditorShell/selection'
import styles from './styles.module.scss'

export interface Props {
  tree: CourseTreeShape
  selection: EditorSelection
  onSelect: (next: EditorSelection) => void
}

/**
 * Left-rail tree: course root → modules → tasks. Reorder via up/down arrows
 * keeps the surface keyboard-accessible without dragging from a touch screen.
 */
export default function CourseTree({ tree, selection, onSelect }: Props) {
  const utils = api.useUtils()
  const [moduleModalOpened, moduleModal] = useDisclosure(false)
  const [moduleTitle, setModuleTitle] = useState('')

  const createModule = api.admin.courseEditor.module.create.useMutation({
    onSuccess: async newId => {
      notifications.show({ color: 'teal', message: 'Модуль создан.' })
      await utils.admin.courseEditor.get.invalidate({ courseId: tree.id })
      onSelect({ kind: 'module', moduleId: newId })
      moduleModal.close()
      setModuleTitle('')
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })
  const reorderModules = api.admin.courseEditor.module.reorder.useMutation({
    onSuccess: async () => {
      await utils.admin.courseEditor.get.invalidate({ courseId: tree.id })
    }
  })
  const deleteModule = api.admin.courseEditor.module.delete.useMutation({
    onSuccess: async () => {
      await utils.admin.courseEditor.get.invalidate({ courseId: tree.id })
    }
  })
  const createTask = api.admin.courseEditor.task.create.useMutation({
    onSuccess: async newId => {
      notifications.show({ color: 'teal', message: 'Задача создана.' })
      await utils.admin.courseEditor.get.invalidate({ courseId: tree.id })
      const moduleId = createTask.variables?.moduleId
      if (moduleId) onSelect({ kind: 'task', moduleId, taskId: newId })
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })
  const reorderTasks = api.admin.courseEditor.task.reorder.useMutation({
    onSuccess: async () => {
      await utils.admin.courseEditor.get.invalidate({ courseId: tree.id })
    }
  })
  const deleteTask = api.admin.courseEditor.task.delete.useMutation({
    onSuccess: async () => {
      await utils.admin.courseEditor.get.invalidate({ courseId: tree.id })
    }
  })

  const moveModule = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= tree.modules.length) return
    const ordered = tree.modules.map(courseModule => courseModule.id)
    const [removed] = ordered.splice(index, 1)
    if (!removed) return
    ordered.splice(target, 0, removed)
    reorderModules.mutate({ courseId: tree.id, orderedIds: ordered })
  }

  const moveTask = (moduleId: string, index: number, direction: -1 | 1) => {
    const courseModule = tree.modules.find(item => item.id === moduleId)
    if (!courseModule) return
    const target = index + direction
    if (target < 0 || target >= courseModule.tasks.length) return
    const ordered = courseModule.tasks.map(task => task.id)
    const [removed] = ordered.splice(index, 1)
    if (!removed) return
    ordered.splice(target, 0, removed)
    reorderTasks.mutate({ moduleId, orderedIds: ordered })
  }

  return (
    <AdminCard
      title="Структура"
      actions={
        <Button
          size="xs"
          variant="light"
          leftSection={<FontAwesomeIcon icon={faPlus} />}
          onClick={moduleModal.open}
        >
          Модуль
        </Button>
      }
      flush
    >
      <Stack gap="xs" p="sm">
        <button
          type="button"
          className={`${styles.row} ${selection.kind === 'course' ? styles.row_active : ''}`}
          onClick={() => onSelect({ kind: 'course' })}
        >
          <FontAwesomeIcon icon={faGraduationCap} className={styles.row__icon} />
          <span className={styles.row__title}>{tree.title || 'Без названия'}</span>
          <Badge size="xs" variant="light" color="gray" radius="sm">
            {tree.status}
          </Badge>
        </button>

        {tree.modules.map((courseModule, moduleIndex) => (
          <div key={courseModule.id} className={styles.module}>
            <div
              className={`${styles.row} ${
                selection.kind === 'module' && selection.moduleId === courseModule.id
                  ? styles.row_active
                  : ''
              }`}
            >
              <button
                type="button"
                className={styles.row__handle}
                onClick={() => onSelect({ kind: 'module', moduleId: courseModule.id })}
              >
                <FontAwesomeIcon icon={faChevronRight} className={styles.row__chevron} />
                <span className={styles.row__title}>{courseModule.title}</span>
              </button>
              <Group gap={2}>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  aria-label="Вверх"
                  onClick={() => moveModule(moduleIndex, -1)}
                >
                  <FontAwesomeIcon icon={faArrowUp} />
                </ActionIcon>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  aria-label="Вниз"
                  onClick={() => moveModule(moduleIndex, 1)}
                >
                  <FontAwesomeIcon icon={faArrowDown} />
                </ActionIcon>
                <Menu position="bottom-end" withinPortal>
                  <Menu.Target>
                    <ActionIcon size="sm" variant="subtle" aria-label="Меню">
                      <FontAwesomeIcon icon={faEllipsisVertical} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<FontAwesomeIcon icon={faPlus} />}
                      onClick={() =>
                        createTask.mutate({
                          moduleId: courseModule.id,
                          title: 'Новая задача'
                        })
                      }
                    >
                      Добавить задачу
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<FontAwesomeIcon icon={faTrash} />}
                      onClick={() => {
                        if (confirm(`Удалить модуль «${courseModule.title}»?`)) {
                          deleteModule.mutate({ moduleId: courseModule.id })
                        }
                      }}
                    >
                      Удалить
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </div>

            <div className={styles.tasks}>
              {courseModule.tasks.map((task, taskIndex) => (
                <div
                  key={task.id}
                  className={`${styles.task} ${
                    selection.kind === 'task' && selection.taskId === task.id
                      ? styles.task_active
                      : ''
                  }`}
                >
                  <button
                    type="button"
                    className={styles.task__title}
                    onClick={() =>
                      onSelect({ kind: 'task', moduleId: courseModule.id, taskId: task.id })
                    }
                  >
                    <Text size="sm" lineClamp={1}>
                      {task.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {task.kind} · {task.autotests.length} тест(ов)
                    </Text>
                  </button>
                  <Group gap={2}>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      aria-label="Вверх"
                      onClick={() => moveTask(courseModule.id, taskIndex, -1)}
                    >
                      <FontAwesomeIcon icon={faArrowUp} />
                    </ActionIcon>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      aria-label="Вниз"
                      onClick={() => moveTask(courseModule.id, taskIndex, 1)}
                    >
                      <FontAwesomeIcon icon={faArrowDown} />
                    </ActionIcon>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="red"
                      aria-label="Удалить"
                      onClick={() => {
                        if (confirm(`Удалить «${task.title}»?`)) {
                          deleteTask.mutate({ taskId: task.id })
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </ActionIcon>
                  </Group>
                </div>
              ))}
              <Button
                size="compact-xs"
                variant="default"
                leftSection={<FontAwesomeIcon icon={faPlus} />}
                onClick={() =>
                  createTask.mutate({ moduleId: courseModule.id, title: 'Новая задача' })
                }
              >
                Задача
              </Button>
            </div>
          </div>
        ))}
      </Stack>

      <Modal opened={moduleModalOpened} onClose={moduleModal.close} title="Новый модуль" centered>
        <Stack>
          <TextInput
            label="Название"
            value={moduleTitle}
            onChange={event => setModuleTitle(event.currentTarget.value)}
            required
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={moduleModal.close}>
              Отмена
            </Button>
            <Button
              loading={createModule.isPending}
              onClick={() =>
                createModule.mutate({ courseId: tree.id, title: moduleTitle || 'Модуль' })
              }
              disabled={!moduleTitle}
            >
              Создать
            </Button>
          </Group>
        </Stack>
      </Modal>
    </AdminCard>
  )
}
