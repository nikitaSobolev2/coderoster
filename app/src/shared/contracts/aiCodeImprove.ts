import { z } from 'zod'

export const AI_CODE_IMPROVE_TOPIC = 'ai.code_improve.requested' as const

export const aiCodeImproveRequestedSchema = z.object({
  jobId: z.string().min(1)
})

export type AiCodeImproveRequested = z.infer<typeof aiCodeImproveRequestedSchema>
