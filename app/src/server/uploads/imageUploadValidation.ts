import type { UploadKind } from '~/server/services/StorageService'

export const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif'
] as const

export type AllowedImageContentType = (typeof ALLOWED_CONTENT_TYPES)[number]

export const MAX_BYTES_BY_KIND: Record<UploadKind, number> = {
  AVATAR: 4 * 1024 * 1024,
  COURSE_COVER: 8 * 1024 * 1024,
  ACHIEVEMENT_COVER: 8 * 1024 * 1024,
  CONTENT_PAGE_INLINE: 8 * 1024 * 1024
}

export const ADMIN_ONLY_KINDS = new Set<UploadKind>([
  'COURSE_COVER',
  'ACHIEVEMENT_COVER',
  'CONTENT_PAGE_INLINE'
])

export type ImageUploadFailure = {
  message: string
  httpStatus: number
  /** Maps to `TRPCError.code` when thrown from tRPC. */
  trpcCode: 'BAD_REQUEST' | 'FORBIDDEN' | 'PAYLOAD_TOO_LARGE'
}

/** `null` = allowed. */
export function validateImageUpload(params: {
  kind: UploadKind
  contentType: string
  byteLength: number
  role: string
}): ImageUploadFailure | null {
  if (!ALLOWED_CONTENT_TYPES.includes(params.contentType as AllowedImageContentType)) {
    return {
      message: 'Неподдерживаемый тип файла.',
      httpStatus: 400,
      trpcCode: 'BAD_REQUEST'
    }
  }
  if (ADMIN_ONLY_KINDS.has(params.kind) && params.role !== 'admin') {
    return {
      message: 'Загружать такие изображения могут только администраторы.',
      httpStatus: 403,
      trpcCode: 'FORBIDDEN'
    }
  }
  const limit = MAX_BYTES_BY_KIND[params.kind]
  if (params.byteLength > limit) {
    return {
      message: `Файл больше лимита (${Math.round(limit / (1024 * 1024))} МБ).`,
      httpStatus: 413,
      trpcCode: 'PAYLOAD_TOO_LARGE'
    }
  }
  return null
}
