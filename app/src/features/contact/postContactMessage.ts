import type { ContactPayloadInput } from '~/features/contact/contactPayloadSchema'

export const CONTACT_API_PATH = '/api/v1/contact'

export interface ContactSubmitResult {
  ok: boolean
  error?: string
}

export async function postContactMessage(payload: ContactPayloadInput): Promise<ContactSubmitResult> {
  const response = await fetch(CONTACT_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data: unknown = await response.json().catch(() => ({}))
  const parsed = data as { ok?: boolean; error?: string }

  if (!response.ok) {
    return { ok: false, error: parsed.error ?? `Ошибка ${response.status}` }
  }

  if (parsed.ok === false) {
    return { ok: false, error: parsed.error ?? 'Запрос отклонён' }
  }

  return { ok: true }
}
