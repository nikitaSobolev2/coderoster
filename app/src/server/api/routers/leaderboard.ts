import 'server-only'
import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc'
import { leaderboardService } from '~/server/services/LeaderboardService'

const windowSchema = z.enum(['week', 'month', 'allTime']).default('allTime')
const languageSchema = z.enum(['python', 'php', 'all']).default('all')

export const leaderboardRouter = createTRPCRouter({
  global: publicProcedure
    .input(
      z
        .object({
          window: windowSchema,
          language: languageSchema,
          limit: z.number().int().positive().max(100).optional()
        })
        .default({ window: 'allTime', language: 'all' })
    )
    .query(({ input }) =>
      leaderboardService.global({
        window: input.window,
        language: input.language,
        limit: input.limit
      })
    ),

  byCourse: publicProcedure
    .input(
      z.object({
        courseSlug: z.string().min(1).max(120),
        window: windowSchema,
        limit: z.number().int().positive().max(100).optional()
      })
    )
    .query(({ input }) =>
      leaderboardService.byCourse({
        courseSlug: input.courseSlug,
        window: input.window,
        limit: input.limit
      })
    )
})
