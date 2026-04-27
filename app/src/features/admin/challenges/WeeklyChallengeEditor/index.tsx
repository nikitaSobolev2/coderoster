'use client'

import { api, type RouterOutputs } from '~/trpc/react'
import ChallengeShell from '../ChallengeShell'

export type WeeklyChallengeDetail = RouterOutputs['admin']['challenges']['weekly']['get']

export interface Props {
  initial: WeeklyChallengeDetail
  languageOptions: string[]
}

export default function WeeklyChallengeEditor({ initial, languageOptions }: Props) {
  const utils = api.useUtils()
  const detail = api.admin.challenges.weekly.get.useQuery(
    { id: initial.id },
    { initialData: initial, refetchOnWindowFocus: false }
  )

  const invalidate = () => utils.admin.challenges.weekly.get.invalidate({ id: initial.id })

  const updateTask = api.admin.challenges.weekly.task.update.useMutation({ onSuccess: invalidate })
  const createTask = api.admin.challenges.weekly.task.create.useMutation({ onSuccess: invalidate })
  const deleteTask = api.admin.challenges.weekly.task.delete.useMutation({ onSuccess: invalidate })
  const reorderTasks = api.admin.challenges.weekly.task.reorder.useMutation({
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
      header={{ title: 'Задачи спидрана', subtitle: `Неделя: ${challenge.isoWeek}` }}
      tasks={challenge.tasks}
      languageOptions={languageOptions}
      isCreatingTask={createTask.isPending}
      onCreateTask={title => createTask.mutateAsync({ weeklyChallengeId: challenge.id, title })}
      onReorderTasks={async orderedIds => {
        await reorderTasks.mutateAsync({ weeklyChallengeId: challenge.id, orderedIds })
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
