'use client'

import { api } from '~/trpc/react'
import { TaskEditor as SharedTaskEditor } from '~/features/admin/_shared/task-editor'
import type { CourseTree } from '../CourseEditorShell'

export interface Props {
  task: CourseTree['modules'][number]['tasks'][number]
  languageOptions: string[]
}

/**
 * Course-editor wrapper around the shared `TaskEditor`. Wires the
 * `admin.courseEditor.task.*` and `admin.courseEditor.autotest.*` mutations
 * and invalidates the course tree on every successful write.
 */
export default function CourseTaskEditor({ task, languageOptions }: Props) {
  const utils = api.useUtils()
  const invalidate = () => utils.admin.courseEditor.get.invalidate()

  const updateTask = api.admin.courseEditor.task.update.useMutation({ onSuccess: invalidate })
  const createAutotest = api.admin.courseEditor.autotest.create.useMutation({
    onSuccess: invalidate
  })
  const updateAutotest = api.admin.courseEditor.autotest.update.useMutation({
    onSuccess: invalidate
  })
  const deleteAutotest = api.admin.courseEditor.autotest.delete.useMutation({
    onSuccess: invalidate
  })
  const reorderAutotests = api.admin.courseEditor.autotest.reorder.useMutation({
    onSuccess: invalidate
  })

  return (
    <SharedTaskEditor
      task={task}
      languageOptions={languageOptions}
      mutations={{
        updateTask: input => updateTask.mutateAsync(input).then(() => undefined),
        createAutotest: input => createAutotest.mutateAsync(input).then(() => undefined),
        updateAutotest: input => updateAutotest.mutateAsync(input).then(() => undefined),
        deleteAutotest: input => deleteAutotest.mutateAsync(input).then(() => undefined),
        reorderAutotests: input => reorderAutotests.mutateAsync(input).then(() => undefined),
        isUpdatingTask: updateTask.isPending
      }}
    />
  )
}
