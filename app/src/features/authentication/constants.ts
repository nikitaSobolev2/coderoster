/** Post-login / post-sign-up default: `handleAuth` `returnPathname`, authed guests on `/login`/`/signup` layouts. */
export const POST_AUTH_REDIRECT_PATH = '/courses'

export const AUTH_FLOW_COOKIE = 'cr_auth_flow'

/** Flow cookie TTL (seconds); short-lived continuation payload only. */
export const AUTH_FLOW_COOKIE_MAX_AGE = 60 * 15
