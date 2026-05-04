'use client'

import { Text } from '@mantine/core'
import type { Language } from '~/server/repositories/types'
import CodeEditor from '../CodeEditor'

type SolutionVariant = 'draft' | 'improved'

type LiveAiJobFailureFields = {
  errorCode: string | null | undefined
  explanationMarkdown: string | null | undefined
}

function aiJobFailureExplanationText(job: LiveAiJobFailureFields): string {
  if (job.errorCode === 'NO_API_KEY') {
    return 'Не задан ключ API для ИИ.'
  }
  const trimmed = job.explanationMarkdown?.trim()
  if (trimmed && trimmed.length > 0) {
    return trimmed
  }
  return job.errorCode ?? 'Ошибка разбора'
}

export interface InCourseWorkspaceEditorSlotProps {
  solutionVariant: SolutionVariant
  improvedFailedThisLang: boolean
  liveAiJobFailure: LiveAiJobFailureFields | null
  aiBusyTargetingEditor: boolean
  hasDisplayableImprovedCode: boolean
  showImprovedMissingForLanguageMessage: boolean
  editorLanguage: Language
  editorValue: string
  readOnlyEditor: boolean
  onEditorValueChange: (value: string) => void
}

export function InCourseWorkspaceEditorSlot({
  solutionVariant,
  improvedFailedThisLang,
  liveAiJobFailure,
  aiBusyTargetingEditor,
  hasDisplayableImprovedCode,
  showImprovedMissingForLanguageMessage,
  editorLanguage,
  editorValue,
  readOnlyEditor,
  onEditorValueChange
}: Readonly<InCourseWorkspaceEditorSlotProps>) {
  const hideEditorForBusyImprovement =
    improvedFailedThisLang ||
    (solutionVariant === 'improved' && aiBusyTargetingEditor && !hasDisplayableImprovedCode)

  const editorKey =
    solutionVariant === 'improved'
      ? `ai-suggestion:${editorLanguage}`
      : `user-draft:${editorLanguage}`

  return (
    <>
      {solutionVariant === 'improved' && improvedFailedThisLang && liveAiJobFailure ? (
        <Text size="sm" c="red" px="sm" pt="xs" pb={4}>
          {aiJobFailureExplanationText(liveAiJobFailure)}
        </Text>
      ) : null}
      {solutionVariant === 'improved' &&
      !improvedFailedThisLang &&
      aiBusyTargetingEditor &&
      !hasDisplayableImprovedCode ? (
        <Text size="sm" c="dimmed" px="sm" pt="xs" pb={4}>
          ИИ формирует улучшенный код…
        </Text>
      ) : null}
      {showImprovedMissingForLanguageMessage ? (
        <Text size="sm" c="dimmed" px="sm" py="md">
          Для выбранного языка пока нет ИИ-улучшения. Переключи язык с готовым разбором или запусти
          «Улучши код» для этого языка.
        </Text>
      ) : null}
      {showImprovedMissingForLanguageMessage || hideEditorForBusyImprovement ? null : (
        <CodeEditor
          key={editorKey}
          value={editorValue}
          onChange={onEditorValueChange}
          language={editorLanguage}
          readOnly={readOnlyEditor}
        />
      )}
    </>
  )
}
