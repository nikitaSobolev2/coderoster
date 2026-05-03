/**
 * WorkOS hosted AuthKit URLs ignore unknown `prompt` values; `prompt=login` forces re-auth UX.
 */
export function withForcedLoginPrompt(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('prompt', 'login')
    return parsed.toString()
  } catch {
    return url
  }
}
