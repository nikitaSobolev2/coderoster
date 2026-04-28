import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { commentProcedure } from '~/server/api/procedures'
import {
  invalidateProfileCachesForCommentId,
  invalidateProfileCachesForUsername
} from '~/server/cache/invalidateProfileCaches'

export const commentRouter = createTRPCRouter({
  listOnProfile: publicProcedure
    .input(
      z.object({
        username: z.string().min(1).max(64),
        cursor: z.string().nullable().optional()
      })
    )
    .query(({ ctx, input }) =>
      ctx.repositories.comment.listOnProfile(input.username, input.cursor ?? null)
    ),

  post: commentProcedure
    .input(
      z.object({
        username: z.string().min(1).max(64),
        body: z.string().trim().min(1).max(1000)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.repositories.comment.post(ctx.user.id, input.username, input.body)
      await invalidateProfileCachesForUsername(input.username)
      return row
    }),

  delete: protectedProcedure
    .input(z.object({ commentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await invalidateProfileCachesForCommentId(input.commentId)
      await ctx.repositories.comment.delete(ctx.user.id, input.commentId)
      return { ok: true as const }
    }),

  vote: protectedProcedure
    .input(
      z.object({
        commentId: z.string().min(1),
        vote: z.enum(['like', 'dislike'])
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.repositories.comment.like(ctx.user.id, input.commentId, input.vote)
      await invalidateProfileCachesForCommentId(input.commentId)
      return { ok: true as const }
    })
})
