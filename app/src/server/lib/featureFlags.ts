/**
 * Resolves boolean feature flags coming from environment variables. T3 Env
 * normally transforms `USE_FAKE_DATA` into a real boolean, but when
 * `SKIP_ENV_VALIDATION=1` is set (e.g. inside Docker build steps that don't
 * have all secrets) the validation is bypassed and the value comes through as
 * the raw string. JavaScript's truthiness then treats `'false'` as `true` —
 * which silently flips the entire app into fixture mode.
 *
 * Centralising the coercion here keeps every caller honest.
 */
export function isTruthyFlag(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase()
    return normalised === 'true' || normalised === '1' || normalised === 'yes'
  }
  return Boolean(value)
}
