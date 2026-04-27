import 'server-only'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { db } from '~/server/db'
import { env } from '~/env'
import { isTruthyFlag } from '~/server/lib/featureFlags'

const titleSchema = z.string().min(1).max(120)
const codeSchema = z.string().max(50_000)
const languageSchema = z.enum(['python', 'php'])

/**
 * Sandbox is intentionally minimal: stateless code runs go through
 * `execution.run` directly. This router only owns optional snippet storage so
 * users can revisit recent experiments. When `USE_FAKE_DATA` is on the table
 * does not exist; calls return empty arrays / 503 to keep dev offline-safe.
 */
export const sandboxRouter = createTRPCRouter({
  listMine: protectedProcedure.query(async ({ ctx }) => {
    if (isTruthyFlag(env.USE_FAKE_DATA)) return []
    return db.sandboxSnippet.findMany({
      where: { userId: ctx.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 25
    })
  }),

  save: protectedProcedure
    .input(
      z.object({
        id: z.string().nullable().optional(),
        title: titleSchema,
        language: languageSchema,
        code: codeSchema
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (isTruthyFlag(env.USE_FAKE_DATA)) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Сейчас включены фикстуры.' })
      }
      if (input.id) {
        return db.sandboxSnippet.update({
          where: { id: input.id },
          data: { title: input.title, code: input.code, language: input.language }
        })
      }
      return db.sandboxSnippet.create({
        data: {
          userId: ctx.user.id,
          title: input.title,
          code: input.code,
          language: input.language
        }
      })
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (isTruthyFlag(env.USE_FAKE_DATA)) return { ok: true }
      const owned = await db.sandboxSnippet.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        select: { id: true }
      })
      if (!owned) throw new TRPCError({ code: 'NOT_FOUND' })
      await db.sandboxSnippet.delete({ where: { id: input.id } })
      return { ok: true }
    })
})
