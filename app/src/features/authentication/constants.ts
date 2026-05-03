/** Where learners land after successful AuthKit session creation (matches `handleAuth` default). */
export const POST_AUTH_REDIRECT_PATH = '/courses'

export const AUTH_FLOW_COOKIE = 'cr_auth_flow'

/** Flow cookie TTL (seconds); short-lived continuation payload only. */
export const AUTH_FLOW_COOKIE_MAX_AGE = 60 * 15
