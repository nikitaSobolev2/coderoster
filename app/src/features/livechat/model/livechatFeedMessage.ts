/** Client-side row for livechat list + virtual rows (avoid importing server-only repos in UI). */
export interface LivechatFeedMessage {
  id: string
  createdAt: Date
  body: string
  authorKind: 'AUTH' | 'GUEST'
  authorLabel: string
  usernameColor: string
  /** Platform login; only set for AUTH rows with a linked user profile. */
  authorProfileUsername: string | null
}

export function toLivechatFeedMessage(raw: {
  id: string
  createdAt: Date | string
  body: string
  authorKind: 'AUTH' | 'GUEST'
  authorLabel: string
  usernameColor: string
  authorProfileUsername?: string | null
}): LivechatFeedMessage {
  return {
    ...raw,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt : new Date(raw.createdAt as string),
    authorProfileUsername: raw.authorProfileUsername ?? null
  }
}
