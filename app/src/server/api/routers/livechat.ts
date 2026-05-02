import { z } from 'zod'
import { TRPCError } from '@trpc/server'

import { env } from '~/env'
import { isTruthyFlag } from '~/server/lib/featureFlags'
import { sanitizeLivechatBody } from '~/server/lib/sanitize'
import { publishLivechatEvent } from '~/server/livechat/broadcast'
import { parseGuestSessionFromCookieHeader } from '~/server/livechat/guestSession'
import {
  isAllowedUsernameColor,
  LivechatRepository,
  type LivechatMessageDTO
} from '~/server/livechat/livechat.repository'
import { getLivechatGuestPolicy } from '~/server/livechat/livechat.policy'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import {
  livechatConsentProcedure,
  livechatReadProcedure,
  livechatSendProcedure
} from '~/server/api/procedures'
import { db } from '~/server/db'
import {
  LIVECHAT_DEFAULT_USERNAME_COLOR,
  LIVECHAT_USERNAME_COLOR_SWATCHES,
  type LivechatUsernameColorToken
} from '~/shared/constants/livechatColors'
import { LIVECHAT_MESSAGE_BODY_MAX_CHARS } from '~/shared/constants/livechatLimits'

const repo = new LivechatRepository()

const DISALLOWED_CTRL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/

const bodySchema = z
  .string()
  .trim()
  .min(1)
  .max(LIVECHAT_MESSAGE_BODY_MAX_CHARS)
  .refine(
    value => !DISALLOWED_CTRL.test(value),
    '\u041d\u0435\u0434\u043e\u043f\u0443\u0441\u0442\u0438\u043c\u044b\u0435 \u0441\u0438\u043c\u0432\u043e\u043b\u044b'
  )

const usernameColorMutationEnum = z.enum(
  LIVECHAT_USERNAME_COLOR_SWATCHES as unknown as [string, ...string[]]
)

function isPlatformBannedUntil(until: Date | null | undefined): boolean {
  if (!until) return false
  return until.getTime() > Date.now()
}

function isChatBannedUntil(until: Date | null | undefined): boolean {
  if (!until) return false
  return until.getTime() > Date.now()
}

export const livechatRouter = createTRPCRouter({
  listMessages: livechatReadProcedure
    .input(
      z.object({
        cursorOlderId: z.string().nullable(),
        limit: z.number().int().min(1).max(80).optional()
      })
    )
    .query(async ({ input }) => {
      if (isTruthyFlag(env.USE_FAKE_DATA)) {
        return { items: [] as LivechatMessageDTO[], nextCursorOlder: null as string | null }
      }
      const limit = input.limit ?? 50
      if (input.cursorOlderId === null) {
        return repo.listRecent(limit)
      }
      return repo.listOlderThan(input.cursorOlderId, limit)
    }),

  getPolicies: publicProcedure.query(async ({ ctx }) => {
    if (isTruthyFlag(env.USE_FAKE_DATA)) {
      return {
        allowGuests: true,
        guestSessionPresent: false,
        guestHasConsent: false,
        authNeedsConsent: false,
        mustLoginToSend: false,
        chatBanned: false,
        platformBanned: false,
        isAuthenticated: false,
        preferredUsernameColor: LIVECHAT_DEFAULT_USERNAME_COLOR
      }
    }

    const allowGuests = (await getLivechatGuestPolicy()).allowGuests
    const guestSessionId = parseGuestSessionFromCookieHeader(ctx.headers.get('cookie'))

    let guestHasConsent = false
    if (guestSessionId) {
      guestHasConsent = await repo.guestHasConsent(guestSessionId)
    }

    const user = ctx.user
    let authNeedsConsent = false
    let preferredUsernameColor: LivechatUsernameColorToken = LIVECHAT_DEFAULT_USERNAME_COLOR

    if (user) {
      const row = await db.user.findUnique({
        where: { id: user.id },
        select: {
          livechatConsentAt: true,
          livechatUsernameColor: true,
          chatBannedUntil: true,
          bannedUntil: true
        }
      })
      authNeedsConsent = !row?.livechatConsentAt
      if (row?.livechatUsernameColor && isAllowedUsernameColor(row.livechatUsernameColor)) {
        preferredUsernameColor = row.livechatUsernameColor
      }

      const chatBanned = isChatBannedUntil(row?.chatBannedUntil)
      const platformBanned = user.role !== 'admin' && isPlatformBannedUntil(row?.bannedUntil)

      return {
        allowGuests,
        guestSessionPresent: Boolean(guestSessionId),
        guestHasConsent,
        authNeedsConsent,
        mustLoginToSend: !allowGuests && !user,
        chatBanned,
        platformBanned,
        isAuthenticated: true,
        preferredUsernameColor
      }
    }

    return {
      allowGuests,
      guestSessionPresent: Boolean(guestSessionId),
      guestHasConsent,
      authNeedsConsent: false,
      mustLoginToSend: !allowGuests,
      chatBanned: false,
      platformBanned: false,
      isAuthenticated: false,
      preferredUsernameColor: LIVECHAT_DEFAULT_USERNAME_COLOR
    }
  }),

  acceptGuestConsent: livechatConsentProcedure.mutation(async ({ ctx }) => {
    if (isTruthyFlag(env.USE_FAKE_DATA)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Demo mode.' })
    }
    const guestSessionId = parseGuestSessionFromCookieHeader(ctx.headers.get('cookie'))
    if (!guestSessionId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          '\u041d\u0435\u0442 \u0433\u043e\u0441\u0442\u0435\u0432\u043e\u0439 \u0441\u0435\u0441\u0441\u0438\u0438.'
      })
    }
    await repo.recordGuestConsent(guestSessionId)
    return { ok: true as const }
  }),

  acceptUserConsent: protectedProcedure.mutation(async ({ ctx }) => {
    if (isTruthyFlag(env.USE_FAKE_DATA)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Demo mode.' })
    }
    await repo.acceptUserConsent(ctx.user.id)
    return { ok: true as const }
  }),

  setUsernameColor: protectedProcedure
    .input(z.object({ color: usernameColorMutationEnum }))
    .mutation(async ({ ctx, input }) => {
      if (isTruthyFlag(env.USE_FAKE_DATA)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Demo mode.' })
      }
      await repo.setUserUsernameColor(ctx.user.id, input.color as LivechatUsernameColorToken)
      return { ok: true as const }
    }),

  sendMessage: livechatSendProcedure
    .input(
      z.object({
        body: bodySchema,
        usernameColor: z
          .string()
          .optional()
          .refine(
            value => value === undefined || isAllowedUsernameColor(value),
            '\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u0446\u0432\u0435\u0442'
          )
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (isTruthyFlag(env.USE_FAKE_DATA)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Demo mode.' })
      }

      const rawBody = sanitizeLivechatBody(input.body)
      if (rawBody.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            '\u041f\u0443\u0441\u0442\u043e\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435.'
        })
      }
      if (rawBody.length > LIVECHAT_MESSAGE_BODY_MAX_CHARS) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            '\u0421\u043b\u0438\u0448\u043a\u043e\u043c \u0434\u043b\u0438\u043d\u043d\u043e\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435.'
        })
      }

      const policy = await getLivechatGuestPolicy()
      const guestSessionId = parseGuestSessionFromCookieHeader(ctx.headers.get('cookie'))

      if (ctx.user) {
        const row = await db.user.findUnique({
          where: { id: ctx.user.id },
          select: {
            username: true,
            bannedUntil: true,
            chatBannedUntil: true,
            livechatConsentAt: true,
            livechatUsernameColor: true,
            role: true
          }
        })
        if (!row) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message:
              '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d.'
          })
        }
        if (row.role !== 'ADMIN' && isPlatformBannedUntil(row.bannedUntil)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message:
              '\u0410\u043a\u043a\u0430\u0443\u043d\u0442 \u0437\u0430\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u043d.'
          })
        }
        if (isChatBannedUntil(row.chatBannedUntil)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message:
              '\u0411\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u043a\u0430 \u0447\u0430\u0442\u0430.'
          })
        }
        if (!row.livechatConsentAt) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message:
              '\u041d\u0443\u0436\u043d\u043e \u043f\u0440\u0438\u043d\u044f\u0442\u044c \u043f\u0440\u0430\u0432\u0438\u043b\u0430 \u0447\u0430\u0442\u0430.'
          })
        }

        const effectiveColor: LivechatUsernameColorToken =
          row.livechatUsernameColor && isAllowedUsernameColor(row.livechatUsernameColor)
            ? row.livechatUsernameColor
            : LIVECHAT_DEFAULT_USERNAME_COLOR

        const dto = await repo.insertAuthMessage({
          userId: ctx.user.id,
          body: rawBody,
          authorLabel: row.username,
          usernameColor: effectiveColor
        })
        await publishLivechatEvent({ type: 'message', message: dto })
        return dto
      }

      if (!policy.allowGuests) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            '\u0422\u043e\u043b\u044c\u043a\u043e \u0434\u043b\u044f \u0430\u0432\u0442\u043e\u0440\u0438\u0437\u043e\u0432\u0430\u043d\u043d\u044b\u0445 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u0439.'
        })
      }
      if (!guestSessionId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            '\u041d\u0443\u0436\u043d\u0430 \u0433\u043e\u0441\u0442\u0435\u0432\u0430\u044f \u0441\u0435\u0441\u0441\u0438\u044f.'
        })
      }
      const consentOk = await repo.guestHasConsent(guestSessionId)
      if (!consentOk) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            '\u041f\u0440\u0438\u043c\u0438\u0442\u0435 \u043f\u0440\u0430\u0432\u0438\u043b\u0430 \u0447\u0430\u0442\u0430.'
        })
      }

      const guestColor: LivechatUsernameColorToken =
        input.usernameColor && isAllowedUsernameColor(input.usernameColor)
          ? input.usernameColor
          : LIVECHAT_DEFAULT_USERNAME_COLOR

      const dto = await repo.insertGuestMessage({
        guestSessionId,
        body: rawBody,
        guestLabel: `Guest-${guestSessionId.slice(0, 6)}`,
        usernameColor: guestColor
      })
      await publishLivechatEvent({ type: 'message', message: dto })
      return dto
    })
})
