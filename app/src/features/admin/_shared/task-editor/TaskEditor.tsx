'use client'

import { useState } from 'react'
import {
  Button,
  Group,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Tabs,
  Textarea,
  TextInput
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import AdminCard from '~/features/admin/_shared/AdminCard'
import OptionalFieldToggle from '~/features/admin/_shared/OptionalFieldToggle'
import MarkdownEditor from '~/shared/components/ui/MarkdownEditor'
import AutotestList from './AutotestList'
import type { EditableTask, TaskEditorMutations } from './types'

export interface Props {
  task: EditableTask
  languageOptions: string[]
  mutations: TaskEditorMutations
  /** Optional accent above the form, e.g. /<task-id> in the course editor. */
  description?: string
}

const KIND_OPTIONS = [
  { value: 'TASK', label: 'Задача' },
  { value: 'THEORY', label: 'Теория' },
  { value: 'QUIZ', label: 'Тест' }
] as const

type TaskKind = 'TASK' | 'THEORY' | 'QUIZ'

/**
 * Owner-agnostic task editor reused by the course editor and the daily /
 * weekly challenge editors. Receives mutations as plain functions so it
 * doesn't depend on a specific tRPC router.
 */
export default function TaskEditor({ task, languageOptions, mutations, description }: Props) {
  const [title, setTitle] = useState(task.title)
  const [summary, setSummary] = useState(task.summary)
  const [body, setBody] = useState(task.description)
  const [kind, setKind] = useState<TaskKind>(task.kind)
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | string>(task.estimatedMinutes)
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>(task.allowedLanguages)
  const [starterCode, setStarterCode] = useState<string>(
    typeof task.initialData?.predefinedCode === 'string' ? task.initialData.predefinedCode : ''
  )
  const [resultJsonHidden, setResultJsonHidden] = useState(task.result == null)
  const [resultJsonText, setResultJsonText] = useState(
    task.result ? JSON.stringify(task.result, null, 2) : ''
  )

  const submit = async () => {
    let parsedResult: Record<string, unknown> | null = null
    if (!resultJsonHidden && resultJsonText.trim().length > 0) {
      try {
        parsedResult = JSON.parse(resultJsonText) as Record<string, unknown>
      } catch {
        notifications.show({ color: 'red', message: 'JSON решения некорректный.' })
        return
      }
    }

    const baseInitialData = task.initialData ?? {}
    const initialData: Record<string, unknown> = {
      ...baseInitialData,
      predefinedCode: starterCode
    }

    try {
      await mutations.updateTask({
        taskId: task.id,
        patch: {
          title,
          summary,
          description: body,
          kind,
          estimatedMinutes:
            typeof estimatedMinutes === 'number' ? estimatedMinutes : Number(estimatedMinutes) || 0,
          allowedLanguages,
          initialData,
          result: resultJsonHidden ? null : parsedResult
        }
      })
      notifications.show({ color: 'teal', message: 'Задача сохранена.' })
    } catch (cause) {
      notifications.show({
        color: 'red',
        message: cause instanceof Error ? cause.message : 'Не удалось сохранить задачу.'
      })
    }
  }

  return (
    <AdminCard
      title="Задача"
      description={description ?? `/${task.id}`}
      actions={
        <Button onClick={() => void submit()} loading={mutations.isUpdatingTask}>
          Сохранить
        </Button>
      }
    >
      <Tabs defaultValue="content">
        <Tabs.List>
          <Tabs.Tab value="content">Содержание</Tabs.Tab>
          <Tabs.Tab value="tests">Тесты</Tabs.Tab>
          <Tabs.Tab value="starter">Стартовый код</Tabs.Tab>
          <Tabs.Tab value="advanced">Расширенные</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="content" pt="md">
          <Stack gap="md">
            <Group grow>
              <TextInput
                label="Название"
                value={title}
                onChange={event => setTitle(event.currentTarget.value)}
                required
              />
              <Select
                label="Тип"
                value={kind}
                onChange={value => setKind((value as TaskKind) ?? 'TASK')}
                data={[...KIND_OPTIONS]}
                allowDeselect={false}
              />
            </Group>
            <Group grow>
              <NumberInput
                label="Минут на задачу"
                value={estimatedMinutes}
                onChange={value => setEstimatedMinutes(value)}
                min={0}
              />
              <MultiSelect
                label="Разрешённые языки"
                description="Пусто = используется язык по умолчанию"
                value={allowedLanguages}
                onChange={setAllowedLanguages}
                data={languageOptions.map(option => ({ value: option, label: option }))}
                clearable
              />
            </Group>
            <Textarea
              label="Краткое описание"
              value={summary}
              onChange={event => setSummary(event.currentTarget.value)}
              autosize
              minRows={2}
              maxLength={500}
            />
            <MarkdownEditor
              label="Содержание (Markdown)"
              value={body}
              onChange={setBody}
              withImageUpload
              imageUploadKind="CONTENT_PAGE_INLINE"
              minRows={12}
            />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="tests" pt="md">
          <AutotestList taskId={task.id} autotests={task.autotests} mutations={mutations} />
        </Tabs.Panel>

        <Tabs.Panel value="starter" pt="md">
          <Textarea
            label="Стартовый код"
            description="Сохраняется в initialData.predefinedCode"
            value={starterCode}
            onChange={event => setStarterCode(event.currentTarget.value)}
            autosize
            minRows={10}
            maxRows={30}
            styles={{
              input: {
                fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
              }
            }}
          />
        </Tabs.Panel>

        <Tabs.Panel value="advanced" pt="md">
          <OptionalFieldToggle
            label="Эта задача не требует поля «решение» (result JSON)"
            hidden={resultJsonHidden}
            onChange={setResultJsonHidden}
          >
            <Textarea
              label="result JSON"
              description="Произвольный JSON, доступный валидатору"
              value={resultJsonText}
              onChange={event => setResultJsonText(event.currentTarget.value)}
              autosize
              minRows={6}
              maxRows={20}
              styles={{
                input: {
                  fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
                }
              }}
            />
          </OptionalFieldToggle>
        </Tabs.Panel>
      </Tabs>
    </AdminCard>
  )
}
