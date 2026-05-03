import 'server-only'

import { ContactMessageSource } from '@prisma/client'

import type { ContactPayloadInput } from '~/features/contact/contactPayloadSchema'
import { db } from '~/server/db'
import { sanitizePlainText } from '~/server/lib/sanitize'

function mapSource(source: ContactPayloadInput['source']): ContactMessageSource {
  return source === 'platform' ? ContactMessageSource.PLATFORM : ContactMessageSource.HOME
}

export async function persistContactMessage(input: ContactPayloadInput): Promise<void> {
  const name = sanitizePlainText(input.name.trim()).slice(0, 120)
  const message = sanitizePlainText(input.message.trim()).slice(0, 8000)
  const email = input.email.trim().toLowerCase()

  await db.contactMessage.create({
    data: {
      source: mapSource(input.source),
      name,
      email,
      message
    }
  })
}
