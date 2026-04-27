import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { storageService, type UploadKind } from '~/server/services/StorageService'

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif'
] as const

/**
 * Per-kind ceilings keep avatar uploads small (4 MB) while letting course
 * covers and inline content-page images go up to 8 MB. The browser also
 * enforces these — we re-check server-side in case someone bypasses the UI.
 */
const MAX_BYTES_BY_KIND: Record<UploadKind, number> = {
  AVATAR: 4 * 1024 * 1024,
  COURSE_COVER: 8 * 1024 * 1024,
  ACHIEVEMENT_COVER: 8 * 1024 * 1024,
  CONTENT_PAGE_INLINE: 8 * 1024 * 1024
}

const ADMIN_ONLY_KINDS = new Set<UploadKind>([
  'COURSE_COVER',
  'ACHIEVEMENT_COVER',
  'CONTENT_PAGE_INLINE'
])

const createIntentInput = z.object({
  kind: z.enum(['AVATAR', 'COURSE_COVER', 'ACHIEVEMENT_COVER', 'CONTENT_PAGE_INLINE']),
  contentType: z.enum(ALLOWED_CONTENT_TYPES),
  contentLength: z.number().int().positive()
})

export const uploadRouter = createTRPCRouter({
  /**
   * Issue a short-lived presigned PUT URL the browser can upload directly to.
   * Returns the canonical public URL the form should persist on success.
   */
  createIntent: protectedProcedure.input(createIntentInput).mutation(async ({ ctx, input }) => {
    if (ADMIN_ONLY_KINDS.has(input.kind) && ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Загружать обложки могут только администраторы.'
      })
    }
    const limit = MAX_BYTES_BY_KIND[input.kind]
    if (input.contentLength > limit) {
      throw new TRPCError({
        code: 'PAYLOAD_TOO_LARGE',
        message: `Файл больше лимита (${Math.round(limit / (1024 * 1024))} МБ).`
      })
    }
    return storageService.presignPut({
      kind: input.kind,
      ownerId: ctx.user.id,
      contentType: input.contentType
    })
  })
})
