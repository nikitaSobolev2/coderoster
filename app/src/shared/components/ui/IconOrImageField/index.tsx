'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { SegmentedControl, Stack, TextInput } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ImageUploadField, { type UploadKind } from '~/shared/components/ui/ImageUploadField'
import { ICON_KEY_OPTIONS, resolveIcon } from './iconMap'
import styles from './styles.module.scss'

export interface IconOrImageValue {
  iconKey: string | null
  imageUrl: string | null
}

export interface Props {
  value: IconOrImageValue
  onChange: (next: IconOrImageValue) => void
  uploadKind: UploadKind
  label?: string
  hint?: string
  /** Aspect ratio for the image preview; e.g. '1 / 1' for achievement covers. */
  imageAspectRatio?: string
}

type Mode = 'icon' | 'image'

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: 'icon', label: 'Иконка' },
  { value: 'image', label: 'Картинка' }
]

/**
 * Lets admins choose between a built-in icon key (rendered via the shared FA
 * icon map) or an uploaded image (S3 via `ImageUploadField`). The active
 * mode mirrors which column is non-null on save: writing one column does not
 * auto-clear the other, so admins can prepare both and toggle which is
 * active. Renderers prefer image, then icon, then a default fallback.
 */
export default function IconOrImageField({
  value,
  onChange,
  uploadKind,
  label,
  hint,
  imageAspectRatio
}: Props) {
  // Local mode is the single source of truth for which tab is visible. We
  // initialise from the incoming value and never re-derive it from props,
  // so switching to "Картинка" before any upload doesn't snap back when
  // the value is still { iconKey: null, imageUrl: null }. Callers that
  // reuse the same component for multiple rows (e.g. modal forms cycling
  // through achievements) should pass a `key` so React remounts the field.
  const [mode, setMode] = useState<Mode>(() => deriveMode(value))

  const handleModeChange = (next: Mode) => {
    if (next === mode) return
    setMode(next)
    if (next === 'icon') {
      onChange({ iconKey: value.iconKey, imageUrl: null })
    } else {
      onChange({ iconKey: null, imageUrl: value.imageUrl })
    }
  }

  return (
    <div className={styles.field}>
      {label ? <span className={styles.field__label}>{label}</span> : null}
      <SegmentedControl
        value={mode}
        onChange={next => handleModeChange(next as Mode)}
        data={MODE_OPTIONS}
        size="xs"
        fullWidth
      />

      {mode === 'icon' ? (
        <Stack gap="sm">
          <div className={styles.iconRow}>
            <span className={styles.iconPreview}>
              <FontAwesomeIcon icon={resolveIcon(value.iconKey)} />
            </span>
            <TextInput
              flex={1}
              value={value.iconKey ?? ''}
              onChange={event =>
                onChange({
                  iconKey: event.currentTarget.value.trim() || null,
                  imageUrl: value.imageUrl
                })
              }
              placeholder="например graduation-cap"
              description="FontAwesome ключ. Кликни ниже, чтобы вставить готовый."
            />
          </div>
          <div className={styles.iconGrid}>
            {ICON_KEY_OPTIONS.map(key => (
              <button
                key={key}
                type="button"
                className={clsx(styles.iconChip, value.iconKey === key && styles.iconChip_active)}
                onClick={() => onChange({ iconKey: key, imageUrl: value.imageUrl })}
              >
                <FontAwesomeIcon icon={resolveIcon(key)} />
                {key}
              </button>
            ))}
          </div>
        </Stack>
      ) : (
        <ImageUploadField
          value={value.imageUrl}
          onChange={url => onChange({ iconKey: value.iconKey, imageUrl: url })}
          kind={uploadKind}
          aspectRatio={imageAspectRatio}
        />
      )}

      {hint ? <span className={styles.field__hint}>{hint}</span> : null}
    </div>
  )
}

function deriveMode(value: IconOrImageValue): Mode {
  if (value.imageUrl) return 'image'
  if (value.iconKey) return 'icon'
  return 'icon'
}
