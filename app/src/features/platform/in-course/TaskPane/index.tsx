'use client'

import { Text } from '@mantine/core'
import clsx from 'clsx'
import type { LessonDetail } from '~/server/repositories/types'
import Markdown from '~/shared/components/ui/Markdown'
import VerticalCaption from '../components/VerticalCaption'
import LessonMarkdown from '../LessonMarkdown'
import styles from './styles.module.scss'

export type TaskPaneTab = 'assignment' | 'explanation'

export interface Props {
  lesson: LessonDetail
  /** `{module}.{task}` display id (computed from catalog order). */
  lessonOrdinalLabel: string | null
  paneTab: TaskPaneTab
  onPaneTabChange: (tab: TaskPaneTab) => void
  explanationMarkdown: string | null
  /** When true, show centered switch «Задание» / «Пояснение» (after ИИ-разбор доступен). */
  showExplanationTab: boolean
  /**
   * When explanation body is empty: generic wait copy vs «no AI for this language»
   * (task already has ИИ for another language).
   */
  explanationWhenEmpty?: 'waiting' | 'no_lang'
  /**
   * Task column is in the `react-resizable-panels` snap band / collapsed rail (`Panel` ~3% wide).
   * Compact ordinal + vertical title **only** then — not from a px width threshold, so narrowing the
   * workspace column does not flip this mode while the task panel is still wide in layout %.
   */
  collapsedRail?: boolean
}

interface TaskExplanationBodyProps {
  explanationMarkdown: string | null | undefined
  explanationWhenEmpty: 'waiting' | 'no_lang'
}

function TaskExplanationBody({
  explanationMarkdown,
  explanationWhenEmpty
}: Readonly<TaskExplanationBodyProps>) {
  const trimmed = explanationMarkdown?.trim()
  if (trimmed) {
    return (
      <div className={styles.pane__explanationMarkdown}>
        <Markdown source={trimmed} />
      </div>
    )
  }
  if (explanationWhenEmpty === 'no_lang') {
    return (
      <Text size="sm" c="dimmed">
        Для текущего языка ИИ ещё не делал разбор. Переключи язык, для которого улучшение уже есть,
        или запусти «Улучши код» для этого языка.
      </Text>
    )
  }
  return (
    <Text size="sm" c="dimmed">
      Когда ИИ закончит разбор для выбранного языка, здесь появится пояснение к улучшенному коду.
    </Text>
  )
}

export default function TaskPane({
  lesson,
  lessonOrdinalLabel,
  paneTab,
  onPaneTabChange,
  explanationMarkdown,
  showExplanationTab,
  explanationWhenEmpty = 'waiting',
  collapsedRail = false
}: Readonly<Props>) {
  const compactTaskPane = collapsedRail

  const onExplanation = showExplanationTab && paneTab === 'explanation'

  const narrowRegionLabel = [
    lessonOrdinalLabel ?? null,
    `${lesson.moduleTitle} · Урок ${lesson.order}`,
    lesson.title
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      className={styles.viewport}
      data-task-pane-variant={compactTaskPane ? 'compact' : 'wide'}
      suppressHydrationWarning
    >
      {compactTaskPane ? (
        <section className={styles.paneCompact} aria-label={narrowRegionLabel}>
          {lessonOrdinalLabel ? (
            <span className={styles.pane__compactOrdinal}>{lessonOrdinalLabel}</span>
          ) : null}
          <VerticalCaption text={lesson.title} decorative density="taskRail" />
        </section>
      ) : (
        <section className={styles.pane}>
          <header className={styles.pane__head}>
            <span className={styles.pane__module}>
              {lesson.moduleTitle} · Урок {lesson.order}
            </span>
            <h1 className={styles.pane__title}>{lesson.title}</h1>
          </header>

          {showExplanationTab ? (
            <div className={styles.pane__islandWrap}>
              <div className={styles.pane__island} role="tablist" aria-label="Материал урока">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!onExplanation}
                  className={clsx(
                    styles.pane__islandBtn,
                    !onExplanation && styles.pane__islandBtnActive
                  )}
                  onClick={() => onPaneTabChange('assignment')}
                >
                  Задание
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={onExplanation}
                  className={clsx(
                    styles.pane__islandBtn,
                    styles.pane__islandBtnExplanation,
                    onExplanation && styles.pane__islandBtnExplanationActive
                  )}
                  onClick={() => onPaneTabChange('explanation')}
                >
                  Пояснение к ответу
                </button>
              </div>
            </div>
          ) : null}

          {onExplanation ? (
            <div className={styles.pane__bodyExplanation}>
              <TaskExplanationBody
                explanationMarkdown={explanationMarkdown}
                explanationWhenEmpty={explanationWhenEmpty}
              />
            </div>
          ) : (
            <div className={styles.pane__body}>
              <LessonMarkdown source={lesson.body} />
            </div>
          )}
        </section>
      )}
    </div>
  )
}
