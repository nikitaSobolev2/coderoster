'use client'

import { useState } from 'react'
import {
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Tabs,
  TagsInput,
  Textarea,
  TextInput
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'
import MarkdownEditor from '~/shared/components/ui/MarkdownEditor'
import ImageUploadField from '~/shared/components/ui/ImageUploadField'
import type { CourseTree } from '../CourseEditorShell'

export interface Props {
  course: CourseTree
  languageOptions: string[]
  categoryOptions: { value: string; label: string }[]
}

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'beginner' },
  { value: 'intermediate', label: 'intermediate' },
  { value: 'advanced', label: 'advanced' }
]

/**
 * Course-level metadata. Big text fields (`description`) come with a live
 * markdown preview so admins see what learners will see.
 */
export default function CourseMetaForm({ course, languageOptions, categoryOptions }: Props) {
  const utils = api.useUtils()
  const [slug, setSlug] = useState(course.slug)
  const [title, setTitle] = useState(course.title)
  const [shortSummary, setShortSummary] = useState(course.shortSummary)
  const [summary, setSummary] = useState(course.summary)
  const [description, setDescription] = useState(course.description)
  const [language, setLanguage] = useState(course.language)
  const [difficulty, setDifficulty] = useState(course.difficulty)
  const [durationHours, setDurationHours] = useState<number | string>(course.durationHours)
  const [xpReward, setXpReward] = useState<number | string>(course.xpReward)
  const [coverImage, setCoverImage] = useState(course.coverImage ?? '')
  const [categoryId, setCategoryId] = useState<string | null>(course.categoryId)
  const [tags, setTags] = useState<string[]>(course.tags)

  const update = api.admin.courseEditor.updateCourse.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Курс сохранён.' })
      await utils.admin.courseEditor.get.invalidate({ courseId: course.id })
      await utils.admin.catalog.courses.list.invalidate()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  const submit = () => {
    update.mutate({
      courseId: course.id,
      patch: {
        slug,
        title,
        shortSummary,
        summary,
        description,
        language,
        difficulty,
        durationHours:
          typeof durationHours === 'number' ? durationHours : Number(durationHours) || 0,
        xpReward: typeof xpReward === 'number' ? xpReward : Number(xpReward) || 0,
        coverImage: coverImage || null,
        categoryId,
        tags
      }
    })
  }

  return (
    <AdminCard
      title="Метаданные курса"
      actions={
        <Button onClick={submit} loading={update.isPending}>
          Сохранить
        </Button>
      }
    >
      <Tabs defaultValue="meta">
        <Tabs.List>
          <Tabs.Tab value="meta">Карточка</Tabs.Tab>
          <Tabs.Tab value="description">Описание (Markdown)</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="meta" pt="md">
          <Stack gap="md">
            <Group grow>
              <TextInput
                label="Название"
                value={title}
                onChange={event => setTitle(event.currentTarget.value)}
                required
              />
              <TextInput
                label="Slug"
                value={slug}
                onChange={event => setSlug(event.currentTarget.value.toLowerCase())}
                required
              />
            </Group>
            <TextInput
              label="Короткое описание"
              value={shortSummary}
              onChange={event => setShortSummary(event.currentTarget.value)}
              maxLength={280}
            />
            <Textarea
              label="Подзаголовок"
              value={summary}
              onChange={event => setSummary(event.currentTarget.value)}
              minRows={2}
              autosize
              maxLength={800}
            />
            <Group grow>
              <Select
                label="Язык"
                value={language}
                onChange={value => setLanguage(value ?? language)}
                data={languageOptions.map(option => ({ value: option, label: option }))}
                allowDeselect={false}
              />
              <Select
                label="Сложность"
                value={difficulty}
                onChange={value => setDifficulty(value ?? difficulty)}
                data={DIFFICULTY_OPTIONS}
                allowDeselect={false}
              />
            </Group>
            <Group grow>
              <NumberInput
                label="Часов"
                value={durationHours}
                onChange={value => setDurationHours(value)}
                min={0}
              />
              <NumberInput
                label="XP за курс"
                value={xpReward}
                onChange={value => setXpReward(value)}
                min={0}
              />
            </Group>
            <ImageUploadField
              label="Обложка курса"
              value={coverImage || null}
              onChange={value => setCoverImage(value ?? '')}
              kind="COURSE_COVER"
              variant="cover"
              hint="Рекомендуемое соотношение 16:9. PNG / JPG / WEBP — до 8 МБ."
            />
            <Select
              label="Категория"
              value={categoryId}
              onChange={value => setCategoryId(value ?? null)}
              data={categoryOptions}
              clearable
            />
            <TagsInput
              label="Теги"
              value={tags}
              onChange={setTags}
              placeholder="Добавь тег и нажми Enter"
              clearable
              maxTags={20}
            />
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="description" pt="md">
          <MarkdownEditor
            label="Markdown"
            value={description}
            onChange={setDescription}
            withImageUpload
            imageUploadKind="CONTENT_PAGE_INLINE"
            minRows={16}
          />
        </Tabs.Panel>
      </Tabs>
    </AdminCard>
  )
}
