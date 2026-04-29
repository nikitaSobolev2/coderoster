/** Matches `bodySchema` in `server/api/routers/livechat.ts` (trimmed body length). */
export const LIVECHAT_MESSAGE_BODY_MAX_CHARS = 700

/** First page + each "load older" page size (bounded server-side at 80). Keeps DOM / React reconciler bounded. */
export const LIVECHAT_PAGE_SIZE = 20
