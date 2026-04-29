import 'server-only'

import { db } from '~/server/db'

const LIVECHAT_GUEST_POLICY_KEY = 'livechat_guest_policy'

export async function getLivechatGuestPolicy(): Promise<{ allowGuests: boolean }> {
  const row = await db.appSetting.findUnique({ where: { key: LIVECHAT_GUEST_POLICY_KEY } })
  const raw = row?.value as { allowGuests?: boolean } | undefined
  return { allowGuests: raw?.allowGuests !== false }
}

export async function setLivechatGuestPolicy(allowGuests: boolean): Promise<void> {
  await db.appSetting.upsert({
    where: { key: LIVECHAT_GUEST_POLICY_KEY },
    update: { value: { allowGuests } },
    create: { key: LIVECHAT_GUEST_POLICY_KEY, value: { allowGuests } }
  })
}
