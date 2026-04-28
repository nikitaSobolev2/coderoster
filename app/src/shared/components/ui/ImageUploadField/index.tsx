'use client'

import { useState, type CSSProperties } from 'react'
import clsx from 'clsx'
import { ActionIcon, Button, Group, Progress } from '@mantine/core'
import { Dropzone, IMAGE_MIME_TYPE, type FileWithPath } from '@mantine/dropzone'
import { notifications } from '@mantine/notifications'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpFromBracket, faCircleXmark, faRotate } from '@fortawesome/free-solid-svg-icons'
import { api } from '~/trpc/react'
import styles from './styles.module.scss'

export type UploadKind = 'AVATAR' | 'COURSE_COVER' | 'ACHIEVEMENT_COVER' | 'CONTENT_PAGE_INLINE'

export interface Props {
  value: string | null | undefined
  onChange: (publicUrl: string | null) => void
  kind: UploadKind
  label?: string
  hint?: string
  /** Use circular avatar preview + 1:1 aspect ratio. */
  variant?: 'cover' | 'avatar'
  /** Aspect ratio override for the preview (defaults: 16/9 cover, 1/1 avatar). */
  aspectRatio?: string
  /** Caps payload size client-side, mirrored server-side per kind. */
  maxSizeMb?: number
  disabled?: boolean
  error?: string
}

const DEFAULT_MAX_MB_BY_KIND: Record<UploadKind, number> = {
  AVATAR: 4,
  COURSE_COVER: 8,
  ACHIEVEMENT_COVER: 8,
  CONTENT_PAGE_INLINE: 8
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'] as const

type AcceptedContentType = (typeof ACCEPTED_TYPES)[number]

function isAcceptedContentType(value: string): value is AcceptedContentType {
  return (ACCEPTED_TYPES as readonly string[]).includes(value)
}

/**
 * Drop-or-click image picker that uploads directly to S3-compatible storage
 * via a tRPC-issued presigned PUT URL. The form only ever sees the resulting
 * public URL string, so existing mutations keep working unchanged.
 */
export default function ImageUploadField({
  value,
  onChange,
  kind,
  label,
  hint,
  variant = 'cover',
  aspectRatio,
  maxSizeMb,
  disabled = false,
  error
}: Props) {
  const [progress, setProgress] = useState<number | null>(null)
  const createIntent = api.upload.createIntent.useMutation()
  const limitMb = maxSizeMb ?? DEFAULT_MAX_MB_BY_KIND[kind]

  const upload = async (file: FileWithPath) => {
    if (!isAcceptedContentType(file.type)) {
      notifications.show({
        color: 'red',
        message: 'Этот формат не поддерживается. Загрузи jpg, png, webp, avif или gif.'
      })
      return
    }
    try {
      setProgress(0)
      const intent = await createIntent.mutateAsync({
        kind,
        contentType: file.type,
        contentLength: file.size
      })
      await uploadWithProgress(intent.putUrl, intent.headers, file, setProgress)
      onChange(intent.publicUrl)
      notifications.show({ color: 'teal', message: 'Файл загружен.' })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Не удалось загрузить файл.'
      notifications.show({ color: 'red', message })
    } finally {
      setProgress(null)
    }
  }

  const handleReject = () => {
    notifications.show({
      color: 'red',
      message: `Поддерживаются изображения до ${limitMb} МБ (jpg, png, webp, avif, gif).`
    })
  }

  const isUploading = progress !== null
  const hasValue = !!value

  const previewStyle: CSSProperties | undefined =
    aspectRatio !== undefined
      ? ({ ['--upload-aspect-ratio']: aspectRatio } as CSSProperties)
      : undefined

  return (
    <div className={styles.field}>
      {label ? <span className={styles.field__label}>{label}</span> : null}

      {isUploading ? (
        <div className={styles.uploading}>
          <div className={styles.uploading__label}>
            <span>Загружаем…</span>
            <span>{Math.round(progress ?? 0)}%</span>
          </div>
          <Progress value={progress ?? 0} animated />
        </div>
      ) : hasValue ? (
        <div className={styles.preview}>
          <div
            className={clsx(
              styles.preview__media,
              variant === 'avatar' && styles.preview__media_avatar
            )}
            style={previewStyle}
          >
            <img className={styles.preview__image} src={value ?? ''} alt="" />
          </div>
          <div className={styles.preview__actions}>
            <span className={styles.preview__filename}>{value}</span>
            <Group gap="xs" wrap="nowrap">
              <Button
                size="xs"
                variant="default"
                leftSection={<FontAwesomeIcon icon={faRotate} />}
                onClick={() => document.getElementById(`upload-${kind}-${variant}`)?.click()}
                disabled={disabled}
              >
                Заменить
              </Button>
              <ActionIcon
                variant="default"
                size="lg"
                aria-label="Убрать изображение"
                onClick={() => onChange(null)}
                disabled={disabled}
              >
                <FontAwesomeIcon icon={faCircleXmark} />
              </ActionIcon>
            </Group>
          </div>
        </div>
      ) : (
        <Dropzone
          onDrop={files => {
            const file = files[0]
            if (file) void upload(file)
          }}
          onReject={handleReject}
          accept={IMAGE_MIME_TYPE}
          maxSize={limitMb * 1024 * 1024}
          maxFiles={1}
          multiple={false}
          disabled={disabled}
          className={styles.dropzone}
          classNames={{
            root: styles.dropzone
          }}
        >
          <Dropzone.Accept>
            <DropzonePrompt state="accept" limitMb={limitMb} variant={variant} />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <DropzonePrompt state="reject" limitMb={limitMb} variant={variant} />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <DropzonePrompt state="idle" limitMb={limitMb} variant={variant} />
          </Dropzone.Idle>
        </Dropzone>
      )}

      {/* Hidden trigger so "Заменить" reuses the dropzone file picker. */}
      <input
        id={`upload-${kind}-${variant}`}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        hidden
        onChange={event => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (file) void upload(file)
        }}
      />

      {hint ? <span className={styles.field__hint}>{hint}</span> : null}
      {error ? <span className={styles.field__error}>{error}</span> : null}
    </div>
  )
}

interface PromptProps {
  state: 'accept' | 'reject' | 'idle'
  limitMb: number
  variant: 'cover' | 'avatar'
}

function DropzonePrompt({ state, limitMb, variant }: PromptProps) {
  const title =
    state === 'reject'
      ? 'Этот файл не подходит'
      : variant === 'avatar'
        ? 'Перетащи аватар сюда'
        : 'Перетащи изображение сюда'
  return (
    <>
      <FontAwesomeIcon className={styles.dropzone__icon} icon={faArrowUpFromBracket} />
      <p className={styles.dropzone__title}>{title}</p>
      <p className={styles.dropzone__subtitle}>
        или нажми, чтобы выбрать. PNG, JPG, WEBP, AVIF, GIF — до {limitMb} МБ
      </p>
    </>
  )
}

function uploadWithProgress(
  url: string,
  headers: Record<string, string>,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value))
    xhr.upload.onprogress = event => {
      if (!event.lengthComputable) return
      onProgress((event.loaded / event.total) * 100)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100)
        resolve()
      } else {
        reject(new Error(`Ошибка загрузки (HTTP ${xhr.status}).`))
      }
    }
    xhr.onerror = () => reject(new Error('Сетевая ошибка во время загрузки.'))
    xhr.send(file)
  })
}
