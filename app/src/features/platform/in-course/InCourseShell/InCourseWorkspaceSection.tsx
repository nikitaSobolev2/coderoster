'use client'

import Link from 'next/link'
import {
  Button,
  Group,
  Paper,
  Popover,
  SegmentedControl,
  Stack,
  Text,
  Title,
  Tooltip
} from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faCircleCheck,
  faFlagCheckered,
  faLock,
  faPlay,
  faRobot,
  faRotateLeft
} from '@fortawesome/free-solid-svg-icons'
import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { CourseDetail, Language, LessonDetail } from '~/server/repositories/types'
import MobileTaskNavTrigger from '../TaskNav/MobileTaskNavTrigger'
import taskPaneStyles from '../TaskPane/styles.module.scss'
import CodeImproveHeaderTrigger from './CodeImproveHeaderTrigger'
import WorkspaceEditorExecutionSplit from '../WorkspaceEditorExecutionSplit'
import styles from './styles.module.scss'

type Mode = 'run' | 'submit'

export interface LanguageSegmentDatum {
  value: Language
  label: string
}

export interface InCourseWorkspaceSectionProps {
  desktopPanels: boolean
  lesson: LessonDetail
  course: CourseDetail
  canUseEditor: boolean
  completedLessonIds: string[]
  viewerTier: number

  workspaceFootHintText: string

  editorLanguage: Language
  languageSegmentData: LanguageSegmentDatum[]
  onEditorLanguageChange: (lang: Language) => void

  solutionVariant: 'draft' | 'improved'
  onSelectDraftVariant: () => void
  onSelectImprovedVariant: () => void

  canShowVariantSwitch: boolean

  showImproveCodeTrigger: boolean
  showRegenerateForAdmin: boolean
  attemptIsSuccess: boolean
  hasPaidPlan: boolean
  aiImproveBusy: boolean
  regenerateCombinedBusy: boolean
  onStartAi: () => void
  onRegenerateAi: () => void
  onResetCurrentLanguageDraft: () => void

  executionMode: Mode
  runMutationPending: boolean
  onRunClick: () => void
  onSubmitClick: () => void

  editorSlot: ReactNode
  executionSlot: ReactNode

  submitPassed: boolean
  isCompleted: boolean
  completeMutationPending: boolean
  onMarkCompleteClick: () => void

  aiNextNudgePopoverOpened: boolean
  onAiNextNudgePopoverChange: (opened: boolean) => void
  onNextLessonClick: () => void
  onAiNextNudgeTry: () => void
  onAiNextNudgeSkip: () => void
}

export function InCourseWorkspaceSection({
  desktopPanels,
  lesson,
  course,
  canUseEditor,
  completedLessonIds,
  viewerTier,
  workspaceFootHintText,
  editorLanguage,
  languageSegmentData,
  onEditorLanguageChange,
  solutionVariant,
  onSelectDraftVariant,
  onSelectImprovedVariant,
  canShowVariantSwitch,
  showImproveCodeTrigger,
  showRegenerateForAdmin,
  attemptIsSuccess,
  hasPaidPlan,
  aiImproveBusy,
  regenerateCombinedBusy,
  onStartAi,
  onRegenerateAi,
  onResetCurrentLanguageDraft,
  executionMode,
  runMutationPending,
  onRunClick,
  onSubmitClick,
  editorSlot,
  executionSlot,
  submitPassed,
  isCompleted,
  completeMutationPending,
  onMarkCompleteClick,
  aiNextNudgePopoverOpened,
  onAiNextNudgePopoverChange,
  onNextLessonClick,
  onAiNextNudgeTry,
  onAiNextNudgeSkip
}: Readonly<InCourseWorkspaceSectionProps>) {
  return (
    <section
      className={clsx(
        styles.workspace,
        desktopPanels ? styles.workspace_desktopColumn : styles.workspace_mobileLayout
      )}
    >
      {canUseEditor ? null : (
        <Paper className={styles.workspace__lock} radius="md" shadow="sm">
          <Stack align="center" gap="md">
            <FontAwesomeIcon icon={faLock} className={styles.workspace__lockIcon} />
            <Title order={3} ta="center" className={styles.workspace__lockTitle}>
              Урок по тарифу выше
            </Title>
            <Text size="sm" c="dimmed" ta="center" maw={360}>
              Нужен план минимум уровня {lesson.requiredPlanTier}. Оформи подписку и вернись —
              прогресс и черновики сохранятся.
            </Text>
            <Button component={Link} href="/plans" variant="default">
              Смотреть тарифы
            </Button>
          </Stack>
        </Paper>
      )}

      <header className={styles.workspace__head}>
        <div className={styles.workspace__lang}>
          <MobileTaskNavTrigger
            course={course}
            currentLessonId={lesson.id}
            completedLessonIds={completedLessonIds}
            viewerEffectiveTier={viewerTier}
          />
          <div className={styles.workspace__langTools}>
            <SegmentedControl
              size="xs"
              radius="md"
              disabled={!canUseEditor}
              value={editorLanguage}
              onChange={value => onEditorLanguageChange(value as Language)}
              data={languageSegmentData}
            />
            {canShowVariantSwitch ? (
              <div className={styles.workspace__variantIslandWrap}>
                <div
                  className={taskPaneStyles.pane__island}
                  role="tablist"
                  aria-label="Вариант решения"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={solutionVariant === 'draft'}
                    className={clsx(
                      taskPaneStyles.pane__islandBtn,
                      solutionVariant === 'draft' && taskPaneStyles.pane__islandBtnActive
                    )}
                    onClick={onSelectDraftVariant}
                  >
                    Твой вариант
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={solutionVariant === 'improved'}
                    className={clsx(
                      taskPaneStyles.pane__islandBtn,
                      taskPaneStyles.pane__islandBtnExplanation,
                      solutionVariant === 'improved' &&
                        taskPaneStyles.pane__islandBtnExplanationActive
                    )}
                    onClick={onSelectImprovedVariant}
                  >
                    Улучшенный вариант
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className={styles.workspace__actions}>
          <Tooltip label="Сбросить к стартовому коду (текущий язык)" position="bottom" withArrow>
            <Button
              variant="subtle"
              onClick={onResetCurrentLanguageDraft}
              size="xs"
              disabled={!canUseEditor || solutionVariant === 'improved'}
            >
              <FontAwesomeIcon icon={faRotateLeft} />
            </Button>
          </Tooltip>
          {showImproveCodeTrigger ? (
            <CodeImproveHeaderTrigger
              variant="improve"
              attemptIsSuccess={attemptIsSuccess}
              hasPaidPlan={hasPaidPlan}
              startBusy={aiImproveBusy}
              onImproveClick={onStartAi}
              disabled={!canUseEditor}
            />
          ) : null}
          {showRegenerateForAdmin ? (
            <CodeImproveHeaderTrigger
              variant="regenerate"
              attemptIsSuccess
              hasPaidPlan
              startBusy={regenerateCombinedBusy}
              onImproveClick={onRegenerateAi}
              disabled={!canUseEditor}
            />
          ) : null}
          <Button
            variant="default"
            leftSection={<FontAwesomeIcon icon={faPlay} />}
            loading={runMutationPending && executionMode === 'run'}
            onClick={onRunClick}
            disabled={!canUseEditor}
          >
            Запустить
          </Button>
          <Button
            leftSection={<FontAwesomeIcon icon={faFlagCheckered} />}
            loading={runMutationPending && executionMode === 'submit'}
            onClick={onSubmitClick}
            disabled={!canUseEditor}
          >
            Проверить
          </Button>
        </div>
      </header>

      <WorkspaceEditorExecutionSplit
        desktopPanels={desktopPanels}
        editorSlot={editorSlot}
        executionSlot={executionSlot}
      />

      <footer className={styles.workspace__foot}>
        <span className={styles.workspace__hint}>{workspaceFootHintText}</span>
        <div className={styles.workspace__footActions}>
          <Button
            variant="default"
            disabled={!submitPassed || isCompleted || !canUseEditor}
            loading={completeMutationPending}
            leftSection={<FontAwesomeIcon icon={faCircleCheck} />}
            onClick={onMarkCompleteClick}
          >
            Отметить готово
          </Button>
          <Popover
            opened={aiNextNudgePopoverOpened}
            onChange={onAiNextNudgePopoverChange}
            position="top-end"
            shadow="md"
            middlewares={{
              flip: { fallbackPlacements: ['bottom-end', 'top-start'] },
              shift: { padding: 8 }
            }}
            classNames={{ dropdown: styles.nextLessonAiNudgeDropdown }}
          >
            <Popover.Target>
              <Button
                disabled={!lesson.nextLessonId}
                rightSection={<FontAwesomeIcon icon={faArrowRight} />}
                onClick={onNextLessonClick}
              >
                Следующий урок
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <Stack gap="sm">
                <Text size="sm" fw={600}>
                  Улучшить код с ИИ?
                </Text>
                <Text size="sm" c="dimmed">
                  Задача уже принята тестами. Можно сразу перейти дальше или попросить ИИ предложить
                  аккуратный рефакторинг и короткое пояснение — так проще закреплять практику.
                </Text>
                <Group justify="flex-end" gap="xs" wrap="wrap">
                  <Button variant="default" size="xs" onClick={onAiNextNudgeSkip}>
                    Пропустить
                  </Button>
                  <Button
                    size="xs"
                    leftSection={<FontAwesomeIcon icon={faRobot} />}
                    onClick={onAiNextNudgeTry}
                    loading={aiImproveBusy}
                  >
                    Попробовать
                  </Button>
                </Group>
                <Text size="xs" c="dimmed">
                  Нажми «Следующий урок» ещё раз, чтобы перейти без разбора.
                </Text>
              </Stack>
            </Popover.Dropdown>
          </Popover>
        </div>
      </footer>
    </section>
  )
}
