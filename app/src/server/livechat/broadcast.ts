import 'server-only'

import { redis } from '~/server/redis'

export const LIVECHAT_REDIS_CHANNEL = 'livechat:broadcast'

export async function publishLivechatEvent(payload: unknown): Promise<void> {
  await redis.publish(LIVECHAT_REDIS_CHANNEL, JSON.stringify(payload))
}
