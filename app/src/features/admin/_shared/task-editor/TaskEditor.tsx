'use client'

import { useState } from 'react'
import {
  Button,
  Group,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Switch,
  Tabs,
  Textarea,
  TextInput
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import AdminCard from '~/features/admin/_shared/AdminCard'
import OptionalFieldToggle from '~/features/admin/_shared/OptionalFieldToggle'
import MarkdownEditor from '~/shared/components/ui/MarkdownEditor'
import type { Language } from '~/server/repositories/types'
import { starterCodeForLanguage } from '~/shared/lib/taskStarterCodes'
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

type StarterCodeRow = {
  key: string
  language: string
  code: string
}

function primaryFromAllowedList(allowed: string[]): Language {
  const list = (allowed.length > 0 ? allowed : ['python'])
    .map(l => String(l).trim().toLowerCase())
    .filter((l): l is Language => l === 'python' || l === 'php')
  return list[0] ?? 'python'
}

function canonicalAllowedLanguages(task: EditableTask): Language[] {
  const list = (task.allowedLanguages.length > 0 ? task.allowedLanguages : ['python'])
    .map(l => String(l).trim().toLowerCase())
    .filter((l): l is Language => l === 'python' || l === 'php')
  return list.length > 0 ? list : ['python']
}

function normalizeStarterRows(task: EditableTask): StarterCodeRow[] {
  const list = canonicalAllowedLanguages(task)
  const primary = list[0]!
  let i = 0
  return list.map(lang => ({
    key: `${task.id}-st-${i++}`,
    language: lang,
    code: starterCodeForLanguage({
      starterCodes: task.initialData?.starterCodes,
      predefinedCode: task.initialData?.predefinedCode,
      language: lang,
      primaryLanguage: primary
    })
  }))
}

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
  const [starterRows, setStarterRows] = useState<StarterCodeRow[]>(() => normalizeStarterRows(task))
  const [resultJsonHidden, setResultJsonHidden] = useState(task.result == null)
  const [resultJsonText, setResultJsonText] = useState(
    task.result ? JSON.stringify(task.result, null, 2) : ''
  )
  const [isPremium, setIsPremium] = useState(task.isPremium)
  const [minPlanTier, setMinPlanTier] = useState<number>(task.minPlanTier)

  const starterRowsSyncKey = `${task.id}:${JSON.stringify(task.initialData)}`
  const [starterRowsSyncKeyApplied, setStarterRowsSyncKeyApplied] = useState(starterRowsSyncKey)
  if (starterRowsSyncKey !== starterRowsSyncKeyApplied) {
    setStarterRowsSyncKeyApplied(starterRowsSyncKey)
    setStarterRows(normalizeStarterRows(task))
  }

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

    const primary = primaryFromAllowedList(allowedLanguages)
    const primaryRow = starterRows.find(r => String(r.language).trim().toLowerCase() === primary)

    const starterCodes: Record<string, string> = {}
    for (const row of starterRows) {
      const lang = row.language.trim()
      if (lang.length > 0) starterCodes[lang] = row.code
    }
    const predefinedFromRows = primaryRow?.code ?? starterRows[0]?.code ?? ''

    const baseInitialData = task.initialData ?? {}
    const initialData: Record<string, unknown> = {
      ...baseInitialData,
      starterCodes,
      predefinedCode: predefinedFromRows
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
          result: resultJsonHidden ? null : parsedResult,
          isPremium,
          minPlanTier: isPremium ? minPlanTier : 0
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
          <Stack gap="md">
            {starterRows.map((row, index) => (
              <Stack key={row.key} gap="xs">
                <Group align="flex-end" wrap="nowrap" grow>
                  <Select
                    label={index === 0 ? 'Язык' : undefined}
                    value={row.language}
                    onChange={value => {
                      const next = String(value ?? 'python')
                        .trim()
                        .toLowerCase() as Language
                      if (next !== 'python' && next !== 'php') return
                      const primary = primaryFromAllowedList(allowedLanguages)
                      const nextCode = starterCodeForLanguage({
                        starterCodes: task.initialData?.starterCodes,
                        predefinedCode: task.initialData?.predefinedCode,
                        language: next,
                        primaryLanguage: primary
                      })
                      setStarterRows(rows =>
                        rows.map((r, i) =>
                          i === index ? { ...r, language: next, code: nextCode } : r
                        )
                      )
                    }}
                    data={languageOptions.map(option => ({ value: option, label: option }))}
                    allowDeselect={false}
                  />
                  {starterRows.length > 1 ? (
                    <Button
                      variant="light"
                      color="red"
                      size="xs"
                      onClick={() => setStarterRows(rows => rows.filter((_, i) => i !== index))}
                    >
                      Удалить
                    </Button>
                  ) : null}
                </Group>
                <Textarea
                  label={index === 0 ? 'Стартовый код' : undefined}
                  description={
                    index === 0
                      ? 'Сохраняется в initialData.starterCodes и дублируется в predefinedCode (первая строка)'
                      : undefined
                  }
                  value={row.code}
                  onChange={event => {
                    const next =
                      typeof event === 'string' ? event : (event.currentTarget?.value ?? '')
                    setStarterRows(rows =>
                      rows.map((r, i) => (i === index ? { ...r, code: next } : r))
                    )
                  }}
                  autosize
                  minRows={8}
                  maxRows={28}
                  styles={{
                    input: {
                      fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
                    }
                  }}
                />
              </Stack>
            ))}
            <Button
              variant="default"
              size="xs"
              onClick={() =>
                setStarterRows(rows => {
                  const primary = primaryFromAllowedList(allowedLanguages)
                  const used = new Set(rows.map(r => String(r.language).trim().toLowerCase()))
                  const nextLang = (['python', 'php'] as const).find(l => !used.has(l))
                  if (!nextLang) return rows
                  return [
                    ...rows,
                    {
                      key: `${task.id}-st-${rows.length}-${Date.now()}`,
                      language: nextLang,
                      code: starterCodeForLanguage({
                        starterCodes: task.initialData?.starterCodes,
                        predefinedCode: task.initialData?.predefinedCode,
                        language: nextLang,
                        primaryLanguage: primary
                      })
                    }
                  ]
                })
              }
            >
              Добавить стартовый код
            </Button>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="advanced" pt="md">
          <Stack gap="md">
            <Switch
              label="Премиум-задание (нужен план ≥ min tier)"
              checked={isPremium}
              onChange={event => setIsPremium(event.currentTarget.checked)}
            />
            <NumberInput
              label="Минимальный tier плана"
              description="Учитывается только при премиум-задании"
              value={minPlanTier}
              onChange={v => setMinPlanTier(typeof v === 'number' ? v : Number(v) || 0)}
              min={0}
              max={999}
              disabled={!isPremium}
            />
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
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </AdminCard>
  )
}
