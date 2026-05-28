import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it } from 'vitest'

import { FakeAdminCourseEditorRepository } from '~/../tests/setup/repositories/fakeAdmin'

describe('FakeAdminCourseEditorRepository', () => {
  let repo: FakeAdminCourseEditorRepository
  const courseId = faker.string.uuid()

  beforeEach(() => {
    repo = new FakeAdminCourseEditorRepository()
  })

  it('load_returns_modules_with_tasks', async () => {
    const moduleA = repo.seedModule({ courseId })
    repo.seedTask({ moduleId: moduleA.id, order: 0 })
    repo.seedTask({ moduleId: moduleA.id, order: 1 })
    const modules = await repo.load(courseId)
    expect(modules).toHaveLength(1)
    expect(modules[0]?.tasks).toHaveLength(2)
  })

  it('addModule_appends_at_end', async () => {
    await repo.addModule(courseId, 'M1')
    const second = await repo.addModule(courseId, 'M2')
    expect(second.order).toBe(1)
  })

  it('addTask_appends_inside_module', async () => {
    const module = repo.seedModule({ courseId })
    await repo.addTask(module.id, 'T1')
    const second = await repo.addTask(module.id, 'T2')
    expect(second.order).toBe(1)
  })

  it('reorder_lessons_within_module', async () => {
    const module = repo.seedModule({ courseId })
    const taskA = repo.seedTask({ moduleId: module.id, order: 0 })
    const taskB = repo.seedTask({ moduleId: module.id, order: 1 })
    await repo.reorderTasks(module.id, [taskB.id, taskA.id])
    const reloaded = await repo.load(courseId)
    const ordered = reloaded[0]!.tasks.sort((a, b) => a.order - b.order).map(t => t.id)
    expect(ordered).toEqual([taskB.id, taskA.id])
  })

  it('setTaskPremium_flips_isPremium', async () => {
    const module = repo.seedModule({ courseId })
    const task = repo.seedTask({ moduleId: module.id, isPremium: false })
    await repo.setTaskPremium(task.id, true)
    const reloaded = await repo.load(courseId)
    expect(reloaded[0]?.tasks.find(t => t.id === task.id)?.isPremium).toBe(true)
  })

  it('updateAutotests_replaces_full_list_with_provided_order', async () => {
    const module = repo.seedModule({ courseId })
    const task = repo.seedTask({ moduleId: module.id })
    await repo.updateAutotests(task.id, [
      { id: 't1', order: 0, name: 'a', expected: 'A', hidden: false },
      { id: 't2', order: 1, name: 'b', expected: 'B', hidden: true }
    ])
    const reloaded = await repo.load(courseId)
    expect(reloaded[0]?.tasks.find(t => t.id === task.id)?.autotests).toHaveLength(2)
  })

  it('updateAutotests_throws_for_unknown_task', async () => {
    await expect(repo.updateAutotests('missing', [])).rejects.toThrow('TASK_NOT_FOUND')
  })
})
