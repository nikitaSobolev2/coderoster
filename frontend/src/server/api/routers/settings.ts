import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

const socialsSchema = z
  .object({
    github: z.string().url().nullable().optional(),
    linkedin: z.string().url().nullable().optional(),
    x: z.string().url().nullable().optional(),
    website: z.string().url().nullable().optional()
  })
  .partial()

const updateSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  username: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_]+$/i, 'Только латиница, цифры и подчёркивание')
    .optional(),
  bio: z.string().max(400).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  socials: socialsSchema.optional(),
  appearance: z
    .object({ colorScheme: z.enum(['dark', 'light']) })
    .partial()
    .optional()
})

export const settingsRouter = createTRPCRouter({
  getMine: protectedProcedure.query(({ ctx }) => ctx.repositories.settings.getMine(ctx.user.id)),

  update: protectedProcedure
    .input(updateSchema)
    .mutation(({ ctx, input }) => ctx.repositories.settings.update(ctx.user.id, input))
})
