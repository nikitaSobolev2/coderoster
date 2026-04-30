'use client'

import { Text } from '@mantine/core'
import clsx from 'clsx'
import type { LessonDetail } from '~/server/repositories/types'
import Markdown from '~/shared/components/ui/Markdown'
import LessonMarkdown from '../LessonMarkdown'
import styles from './styles.module.scss'

export type TaskPaneTab = 'assignment' | 'explanation'

export interface Props {
  lesson: LessonDetail
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
}

export default function TaskPane({
  lesson,
  paneTab,
  onPaneTabChange,
  explanationMarkdown,
  showExplanationTab,
  explanationWhenEmpty = 'waiting'
}: Props) {
  const onExplanation = showExplanationTab && paneTab === 'explanation'

  return (
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
          {explanationMarkdown?.trim() ? (
            <div className={styles.pane__explanationMarkdown}>
              <Markdown source={explanationMarkdown} />
            </div>
          ) : explanationWhenEmpty === 'no_lang' ? (
            <Text size="sm" c="dimmed">
              Для текущего языка ИИ ещё не делал разбор. Переключи язык, для которого улучшение уже
              есть, или запусти «Улучши код» для этого языка.
            </Text>
          ) : (
            <Text size="sm" c="dimmed">
              Когда ИИ закончит разбор для выбранного языка, здесь появится пояснение к улучшенному
              коду.
            </Text>
          )}
        </div>
      ) : (
        <div className={styles.pane__body}>
          <LessonMarkdown source={lesson.body} />
        </div>
      )}
    </section>
  )
}
