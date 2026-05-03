import { z } from 'zod'

export const contactFormSourceSchema = z.enum(['home', 'platform'])

export const contactPayloadSchema = z.object({
  name: z.string().trim().min(1, { message: 'Укажи имя' }).max(120, { message: 'Слишком длинно' }),
  email: z.string().trim().email({ message: 'Укажи корректный email' }),
  message: z
    .string()
    .trim()
    .min(1, { message: 'Напиши сообщение' })
    .max(8000, { message: 'Сообщение слишком длинное' }),
  source: contactFormSourceSchema.optional().default('home')
})

export type ContactPayloadInput = z.infer<typeof contactPayloadSchema>
