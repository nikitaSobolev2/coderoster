import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { idempotentProcedure } from '~/server/api/procedures'

const deletionInputSchema = z.object({
  /** User must retype their username to confirm the irreversible action. */
  confirmUsername: z.string().min(1)
})

/**
 * Account-level mutations. Deletion is asynchronous: the request is enqueued
 * via the outbox and processed by `accountDeletionConsumer`. Returning quickly
 * keeps the UX snappy and lets the irreversible cascade run with retries.
 */
export const accountRouter = createTRPCRouter({
  status: protectedProcedure.query(({ ctx }) => ctx.repositories.settings.getMine(ctx.user.id)),

  requestDeletion: idempotentProcedure
    .input(deletionInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.confirmUsername.trim().toLowerCase() !== ctx.user.username.toLowerCase()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Подтверждение никнейма не совпадает.'
        })
      }
      return ctx.repositories.account.requestDeletion(ctx.user.id)
    })
})
