'use client'

import { ActionIcon, Tooltip } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBold,
  faCode,
  faFileCode,
  faHeading,
  faImage,
  faItalic,
  faLink,
  faListOl,
  faListUl,
  faQuoteRight
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import styles from './styles.module.scss'

export type ToolbarAction =
  | 'h2'
  | 'h3'
  | 'bold'
  | 'italic'
  | 'inlineCode'
  | 'codeBlock'
  | 'link'
  | 'image'
  | 'bulletList'
  | 'orderedList'
  | 'quote'

export interface Props {
  onAction: (action: ToolbarAction) => void
  withImage: boolean
  disabled?: boolean
}

interface ButtonSpec {
  action: ToolbarAction
  icon: IconDefinition
  label: string
}

const HEADING_GROUP: ButtonSpec[] = [
  { action: 'h2', icon: faHeading, label: 'Заголовок 2' },
  { action: 'h3', icon: faHeading, label: 'Заголовок 3' }
]

const FORMATTING_GROUP: ButtonSpec[] = [
  { action: 'bold', icon: faBold, label: 'Жирный (Ctrl+B)' },
  { action: 'italic', icon: faItalic, label: 'Курсив (Ctrl+I)' },
  { action: 'inlineCode', icon: faCode, label: 'Inline-код' },
  { action: 'codeBlock', icon: faFileCode, label: 'Блок кода' }
]

const INSERT_GROUP: ButtonSpec[] = [
  { action: 'link', icon: faLink, label: 'Ссылка' },
  { action: 'image', icon: faImage, label: 'Изображение' }
]

const LIST_GROUP: ButtonSpec[] = [
  { action: 'bulletList', icon: faListUl, label: 'Маркированный список' },
  { action: 'orderedList', icon: faListOl, label: 'Нумерованный список' },
  { action: 'quote', icon: faQuoteRight, label: 'Цитата' }
]

export default function Toolbar({ onAction, withImage, disabled = false }: Props) {
  const insertGroup = withImage ? INSERT_GROUP : INSERT_GROUP.filter(b => b.action !== 'image')
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Markdown panel">
      <ToolbarGroup buttons={HEADING_GROUP} onAction={onAction} disabled={disabled} prefix="H" />
      <ToolbarGroup buttons={FORMATTING_GROUP} onAction={onAction} disabled={disabled} />
      <ToolbarGroup buttons={insertGroup} onAction={onAction} disabled={disabled} />
      <ToolbarGroup buttons={LIST_GROUP} onAction={onAction} disabled={disabled} />
    </div>
  )
}

function ToolbarGroup({
  buttons,
  onAction,
  disabled,
  prefix
}: {
  buttons: ButtonSpec[]
  onAction: (action: ToolbarAction) => void
  disabled: boolean
  prefix?: string
}) {
  return (
    <div className={styles.toolbar__group}>
      {buttons.map(button => (
        <Tooltip key={button.action} label={button.label} withArrow position="bottom">
          <ActionIcon
            variant="subtle"
            size="md"
            aria-label={button.label}
            onClick={() => onAction(button.action)}
            disabled={disabled}
          >
            {prefix === 'H' ? (
              <span style={{ fontWeight: 700, fontSize: button.action === 'h2' ? 13 : 11 }}>
                {button.action.toUpperCase()}
              </span>
            ) : (
              <FontAwesomeIcon icon={button.icon} />
            )}
          </ActionIcon>
        </Tooltip>
      ))}
    </div>
  )
}
