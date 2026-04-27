'use client'

import { api, type RouterOutputs } from '~/trpc/react'
import ChallengeShell from '../ChallengeShell'

export type DailyChallengeDetail = RouterOutputs['admin']['challenges']['daily']['get']

export interface Props {
  initial: DailyChallengeDetail
  languageOptions: string[]
}

/**
 * Wires the shared `ChallengeShell` to the daily-challenge tRPC namespace.
 * Mirrors the structure of `CourseEditorShell` — single source of truth for
 * the layout, owner-specific mutations live here.
 */
export default function DailyChallengeEditor({ initial, languageOptions }: Props) {
  const utils = api.useUtils()
  const detail = api.admin.challenges.daily.get.useQuery(
    { id: initial.id },
    { initialData: initial, refetchOnWindowFocus: false }
  )

  const invalidate = () => utils.admin.challenges.daily.get.invalidate({ id: initial.id })

  const updateTask = api.admin.challenges.daily.task.update.useMutation({ onSuccess: invalidate })
  const createTask = api.admin.challenges.daily.task.create.useMutation({ onSuccess: invalidate })
  const deleteTask = api.admin.challenges.daily.task.delete.useMutation({ onSuccess: invalidate })
  const reorderTasks = api.admin.challenges.daily.task.reorder.useMutation({
    onSuccess: invalidate
  })
  const createAutotest = api.admin.challenges.autotest.create.useMutation({ onSuccess: invalidate })
  const updateAutotest = api.admin.challenges.autotest.update.useMutation({ onSuccess: invalidate })
  const deleteAutotest = api.admin.challenges.autotest.delete.useMutation({ onSuccess: invalidate })
  const reorderAutotests = api.admin.challenges.autotest.reorder.useMutation({
    onSuccess: invalidate
  })

  if (!detail.data) return null
  const challenge = detail.data

  return (
    <ChallengeShell
      challengeId={challenge.id}
      header={{
        title: 'Задачи дейлика',
        subtitle: `Дата: ${challenge.date}`
      }}
      tasks={challenge.tasks}
      languageOptions={languageOptions}
      isCreatingTask={createTask.isPending}
      onCreateTask={title => createTask.mutateAsync({ dailyChallengeId: challenge.id, title })}
      onReorderTasks={async orderedIds => {
        await reorderTasks.mutateAsync({ dailyChallengeId: challenge.id, orderedIds })
      }}
      onDeleteTask={async taskId => {
        await deleteTask.mutateAsync({ taskId })
      }}
      taskMutations={{
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
