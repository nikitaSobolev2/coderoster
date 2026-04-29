import { z } from 'zod'

import { adminProcedure } from '~/server/api/procedures'
import { createTRPCRouter } from '~/server/api/trpc'
import { getLivechatGuestPolicy, setLivechatGuestPolicy } from '~/server/livechat/livechat.policy'

export const adminLivechatRouter = createTRPCRouter({
  getGuestPolicy: adminProcedure.query(() => getLivechatGuestPolicy()),

  setGuestPolicy: adminProcedure
    .input(z.object({ allowGuests: z.boolean() }))
    .mutation(({ input }) => setLivechatGuestPolicy(input.allowGuests))
})
