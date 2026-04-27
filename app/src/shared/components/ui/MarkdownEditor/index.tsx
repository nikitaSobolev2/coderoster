'use client'

import { useCallback, useRef, useState } from 'react'
import clsx from 'clsx'
import { Modal, SegmentedControl } from '@mantine/core'
import Markdown from '~/shared/components/ui/Markdown'
import ImageUploadField, { type UploadKind } from '~/shared/components/ui/ImageUploadField'
import Toolbar, { type ToolbarAction } from './Toolbar'
import {
  applyLinePrefix,
  insertAtCursor,
  wrapAsCodeBlock,
  wrapSelection,
  type EditResult
} from './selection'
import styles from './styles.module.scss'

export interface Props {
  value: string
  onChange: (next: string) => void
  label?: string
  hint?: string
  /** Show the inline image-upload button in the toolbar. */
  withImageUpload?: boolean
  /** Required when `withImageUpload` is true; classifies uploaded inline images. */
  imageUploadKind?: UploadKind
  /** Initial layout mode. Defaults to side-by-side preview on wide screens. */
  defaultMode?: EditorMode
  minRows?: number
  disabled?: boolean
}

type EditorMode = 'split' | 'edit' | 'preview'

const MODE_OPTIONS: { label: string; value: EditorMode }[] = [
  { label: 'Сплит', value: 'split' },
  { label: 'Только редактор', value: 'edit' },
  { label: 'Только превью', value: 'preview' }
]

/**
 * Source-mode markdown editor with a Mantine-styled toolbar, live preview
 * (uses the shared `Markdown` renderer so server output and editor preview
 * stay in lockstep), and an optional inline image upload that hands off to
 * `ImageUploadField` for the actual upload.
 */
export default function MarkdownEditor({
  value,
  onChange,
  label,
  hint,
  withImageUpload = false,
  imageUploadKind,
  defaultMode = 'split',
  minRows = 18,
  disabled = false
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [mode, setMode] = useState<EditorMode>(defaultMode)
  const [imageModalOpen, setImageModalOpen] = useState(false)

  const applyEdit = useCallback(
    (compute: (textarea: HTMLTextAreaElement) => EditResult) => {
      const textarea = textareaRef.current
      if (!textarea) return
      const result = compute(textarea)
      onChange(result.value)
      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(result.selectionStart, result.selectionEnd)
      })
    },
    [onChange]
  )

  const handleAction = useCallback(
    (action: ToolbarAction) => {
      if (action === 'image') {
        setImageModalOpen(true)
        return
      }
      applyEdit(textarea => runAction(action, textarea))
    },
    [applyEdit]
  )

  const handleImageUploaded = useCallback(
    (publicUrl: string | null) => {
      if (!publicUrl) return
      setImageModalOpen(false)
      applyEdit(textarea => {
        const snippet = `![](${publicUrl})`
        return insertAtCursor(
          textarea.value,
          textarea.selectionStart,
          textarea.selectionEnd,
          snippet
        )
      })
    },
    [applyEdit]
  )

  const showEditor = mode !== 'preview'
  const showPreview = mode !== 'edit'
  const splitWithPreview = mode === 'split'

  return (
    <div className={styles.editor}>
      {label ? <span className={styles.editor__label}>{label}</span> : null}

      <div className={styles.shell}>
        <Toolbar onAction={handleAction} withImage={withImageUpload} disabled={disabled} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '0.4rem 0.6rem',
            borderBottom: 'var(--border-width-hair) solid var(--platform-color-divider)'
          }}
        >
          <SegmentedControl
            size="xs"
            value={mode}
            onChange={value => setMode(value as EditorMode)}
            data={MODE_OPTIONS}
          />
        </div>
        <div className={clsx(styles.split, splitWithPreview && styles.split_with_preview)}>
          {showEditor ? (
            <div className={styles.pane}>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                value={value}
                disabled={disabled}
                onChange={event => onChange(event.currentTarget.value)}
                onKeyDown={event => handleKeyboardShortcut(event, applyEdit)}
                rows={minRows}
                spellCheck={false}
              />
            </div>
          ) : null}
          {showPreview ? (
            <div className={clsx(styles.pane, styles.pane_preview)}>
              <Markdown source={value || '_Пусто_'} />
            </div>
          ) : null}
        </div>
      </div>

      {hint ? <span className={styles.editor__hint}>{hint}</span> : null}

      {withImageUpload && imageUploadKind ? (
        <Modal
          opened={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          title="Вставить изображение"
          centered
        >
          <ImageUploadField
            value={null}
            onChange={handleImageUploaded}
            kind={imageUploadKind}
            label="Файл"
            hint="После загрузки в текст будет вставлен `![](...)` со ссылкой на изображение."
          />
        </Modal>
      ) : null}
    </div>
  )
}

function runAction(action: ToolbarAction, textarea: HTMLTextAreaElement): EditResult {
  const { value, selectionStart, selectionEnd } = textarea
  switch (action) {
    case 'h2':
      return applyLinePrefix(value, selectionStart, selectionEnd, '## ')
    case 'h3':
      return applyLinePrefix(value, selectionStart, selectionEnd, '### ')
    case 'bold':
      return wrapSelection(value, selectionStart, selectionEnd, '**', '**', 'жирный текст')
    case 'italic':
      return wrapSelection(value, selectionStart, selectionEnd, '_', '_', 'курсив')
    case 'inlineCode':
      return wrapSelection(value, selectionStart, selectionEnd, '`', '`', 'код')
    case 'codeBlock':
      return wrapAsCodeBlock(value, selectionStart, selectionEnd)
    case 'link': {
      const selected = value.slice(selectionStart, selectionEnd) || 'текст ссылки'
      const snippet = `[${selected}](https://)`
      return insertAtCursor(
        value.slice(0, selectionStart) + value.slice(selectionEnd),
        selectionStart,
        selectionStart,
        snippet
      )
    }
    case 'bulletList':
      return applyLinePrefix(value, selectionStart, selectionEnd, '- ')
    case 'orderedList':
      return applyLinePrefix(value, selectionStart, selectionEnd, '1. ')
    case 'quote':
      return applyLinePrefix(value, selectionStart, selectionEnd, '> ')
    case 'image':
      return { value, selectionStart, selectionEnd }
  }
}

function handleKeyboardShortcut(
  event: React.KeyboardEvent<HTMLTextAreaElement>,
  applyEdit: (compute: (textarea: HTMLTextAreaElement) => EditResult) => void
) {
  if (!(event.ctrlKey || event.metaKey)) return
  const key = event.key.toLowerCase()
  if (key === 'b') {
    event.preventDefault()
    applyEdit(textarea => runAction('bold', textarea))
  } else if (key === 'i') {
    event.preventDefault()
    applyEdit(textarea => runAction('italic', textarea))
  } else if (key === 'k') {
    event.preventDefault()
    applyEdit(textarea => runAction('link', textarea))
  }
}
