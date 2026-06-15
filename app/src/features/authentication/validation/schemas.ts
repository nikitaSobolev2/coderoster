import { z } from 'zod'

export const emailSchema = z.object({
  email: z.string().trim().email({ message: 'Укажи корректный email' })
})

export const passwordSchema = z.object({
  password: z
    .string()
    .min(8, { message: 'Минимум 8 символов' })
    .max(128, { message: 'Слишком длинный пароль' })
})

export const otpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, { message: 'Нужен 6-значный код' })
})

/** Shared fields for signup steps (password completion omits consent — it lives on the sealed flow cookie). */
export const signupProfileBodySchema = z.object({
  email: z.string().trim().email({ message: 'Укажи корректный email' }),
  firstName: z
    .string()
    .trim()
    .min(1, { message: 'Укажи имя' })
    .max(80, { message: 'Слишком длинное имя' }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: 'Укажи фамилию' })
    .max(80, { message: 'Слишком длинная фамилия' })
})

export const signupProfileSchema = signupProfileBodySchema
  .extend({
    acceptPersonalDataProcessing: z.boolean()
  })
  .refine(data => data.acceptPersonalDataProcessing === true, {
    message: 'Нужно согласие на обработку персональных данных',
    path: ['acceptPersonalDataProcessing']
  })

export const signupCompletePasswordSchema = signupProfileBodySchema.extend({
  password: z
    .string()
    .min(8, { message: 'Минимум 8 символов' })
    .max(128, { message: 'Слишком длинный пароль' })
})

export const passwordResetCompleteSchema = z.object({
  token: z.string().trim().min(10, { message: 'Недействительная ссылка сброса' }),
  newPassword: z
    .string()
    .min(8, { message: 'Минимум 8 символов' })
    .max(128, { message: 'Слишком длинный пароль' })
})

export const signupMagicCompleteSchema = signupProfileBodySchema

export const authFlowCookieSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('signin'),
    email: z.string().email(),
    verificationMode: z.enum(['magic', 'email_verify']).optional(),
    pendingAuthenticationToken: z.string().optional(),
    /** Sealed in flow cookie when AUTH_OTP_BYPASS_CODE is set (password sign-in email verify). */
    bypassAuthPassword: z.string().optional()
  }),
  z.object({
    kind: z.literal('signup'),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    /** ISO-8601 timestamp when the user accepted personal-data processing (profile step). */
    personalDataProcessingConsentAt: z.string().min(1),
    verificationMode: z.enum(['magic', 'email_verify']).optional(),
    pendingAuthenticationToken: z.string().optional(),
    /** Sealed in flow cookie when AUTH_OTP_BYPASS_CODE is set (password signup email verify). */
    bypassAuthPassword: z.string().optional()
  }),
  z.object({
    kind: z.literal('signup_hint'),
    email: z.string().email()
  })
])

export type AuthFlowCookiePayload = z.infer<typeof authFlowCookieSchema>
