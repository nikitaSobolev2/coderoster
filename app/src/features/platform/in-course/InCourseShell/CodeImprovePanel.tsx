'use client'

import { Alert, Loader, ScrollArea, Stack, Text } from '@mantine/core'
import Markdown from '~/shared/components/ui/Markdown'
import styles from './CodeImprovePanel.module.scss'

export type CodeImproveJobTerminal = {
  language: string | null
  improvedCode: string | null
  explanationMarkdown: string | null
  errorCode: string | null
  status: 'DONE' | 'FAILED'
}

const STREAM_LANG_LABEL: Record<string, string> = {
  python: 'Python',
  php: 'PHP'
}

function streamLanguageCaption(raw: string | null | undefined): string {
  if (!raw) return ''
  return STREAM_LANG_LABEL[raw] ?? raw
}

export interface CodeImprovePanelProps {
  /** Task lesson with Pro+ feature */
  enabled: boolean
  jobId: string | null
  streamingText: string
  terminal: CodeImproveJobTerminal | null
  streamError: string | null
}

/**
 * Stream / results surface below the editor. The «Улучши код» control lives in
 * `CodeImproveHeaderTrigger` in the workspace header.
 */
export default function CodeImprovePanel({
  enabled,
  jobId,
  streamingText,
  terminal,
  streamError
}: CodeImprovePanelProps) {
  if (!enabled) return null
  if (!jobId) return null

  const waitingForStream = !terminal && !streamError
  const streamErrorHuman =
    streamError === 'connection_lost'
      ? 'Запрос к воркеру ИИ не удался. Проверь логи `code-improve-worker`, outbox и ключ API.'
      : streamError === 'parse_error'
        ? 'Не удалось разобрать ответ сервера.'
        : streamError

  return (
    <div className={styles.panelSurface}>
      <Stack gap="md">
        {streamError ? (
          <Alert color="red" title="ИИ-разбор">
            {streamErrorHuman}
          </Alert>
        ) : null}

        {waitingForStream && !streamingText ? (
          <Stack align="center" gap="xs" py="sm">
            <Loader type="oval" size="sm" />
            <Text size="sm" c="dimmed" ta="center">
              ИИ обрабатывает задание…
            </Text>
          </Stack>
        ) : null}

        <div className={styles.stream}>
          {streamingText ? (
            <ScrollArea h={120} offsetScrollbars className={styles.streamChunk}>
              <Text size="sm" component="pre" className={styles.pre}>
                {streamingText}
              </Text>
            </ScrollArea>
          ) : null}
          {terminal?.status === 'DONE' && terminal.improvedCode ? (
            <div>
              <Text size="xs" fw={600} mb={4} tt="uppercase" c="dimmed">
                Предложенный код
                {terminal.language ? ` · ${streamLanguageCaption(terminal.language)}` : ''}
              </Text>
              <ScrollArea h={200} offsetScrollbars>
                <pre className={styles.codeBlock}>{terminal.improvedCode}</pre>
              </ScrollArea>
            </div>
          ) : null}
          {terminal?.status === 'FAILED' ? (
            <Alert color="orange" title="Не удалось">
              {terminal.errorCode ?? 'Ошибка воркера'}
            </Alert>
          ) : null}
          {terminal?.explanationMarkdown ? (
            <div>
              <Text size="xs" fw={600} mb={4} tt="uppercase" c="dimmed">
                Пояснение
                {terminal.language ? ` · ${streamLanguageCaption(terminal.language)}` : ''}
              </Text>
              <Markdown source={terminal.explanationMarkdown} />
            </div>
          ) : null}
        </div>
      </Stack>
    </div>
  )
}
