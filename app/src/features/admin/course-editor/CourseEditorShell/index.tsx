'use client'

import { useState } from 'react'
import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'
import CourseTree from '../CourseTree'
import CourseMetaForm from '../CourseMetaForm'
import ModuleEditor from '../ModuleEditor'
import TaskEditor from '../TaskEditor'
import type { EditorSelection } from './selection'
import styles from './styles.module.scss'

export type CourseTree = RouterOutputs['admin']['courseEditor']['get']

export interface Props {
  initialTree: CourseTree
  languageOptions: string[]
  categoryOptions: { value: string; label: string }[]
}

/**
 * Three-pane course editor: left tree → center form → right preview is folded
 * into the form panes via tabs. Selection is derived from the latest tree
 * snapshot so deletions / external edits silently fall back to the course root.
 */
export default function CourseEditorShell({
  initialTree,
  languageOptions,
  categoryOptions
}: Props) {
  const tree = api.admin.courseEditor.get.useQuery(
    { courseId: initialTree.id },
    { initialData: initialTree, refetchOnWindowFocus: false }
  )
  const [selection, setSelection] = useState<EditorSelection>({ kind: 'course' })

  if (!tree.data) return null

  const effective = resolveSelection(tree.data, selection)

  return (
    <div className={styles.shell}>
      <div className={styles.shell__tree}>
        <CourseTree tree={tree.data} selection={effective} onSelect={setSelection} />
      </div>
      <div className={styles.shell__form}>
        {effective.kind === 'course' ? (
          <CourseMetaForm
            key={tree.data.id}
            course={tree.data}
            languageOptions={languageOptions}
            categoryOptions={categoryOptions}
          />
        ) : null}
        {effective.kind === 'module' ? renderModuleEditor(tree.data, effective.moduleId) : null}
        {effective.kind === 'task'
          ? renderTaskEditor(tree.data, effective.taskId, languageOptions)
          : null}
      </div>
    </div>
  )
}

function resolveSelection(tree: CourseTree, selection: EditorSelection): EditorSelection {
  if (selection.kind === 'task') {
    const exists = tree.modules.some(courseModule =>
      courseModule.tasks.some(task => task.id === selection.taskId)
    )
    return exists ? selection : { kind: 'course' }
  }
  if (selection.kind === 'module') {
    const exists = tree.modules.some(courseModule => courseModule.id === selection.moduleId)
    return exists ? selection : { kind: 'course' }
  }
  return selection
}

function renderModuleEditor(tree: CourseTree, moduleId: string) {
  const courseModule = tree.modules.find(item => item.id === moduleId)
  if (!courseModule) return null
  return (
    <ModuleEditor
      key={moduleId}
      moduleId={moduleId}
      title={courseModule.title}
      description={courseModule.description}
    />
  )
}

function renderTaskEditor(tree: CourseTree, taskId: string, languageOptions: string[]) {
  for (const courseModule of tree.modules) {
    const task = courseModule.tasks.find(item => item.id === taskId)
    if (task) {
      return <TaskEditor key={task.id} task={task} languageOptions={languageOptions} />
    }
  }
  return null
}
