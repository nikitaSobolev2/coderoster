import 'server-only'

import { getWorkOS, saveSession } from '@workos-inc/authkit-nextjs'
import type { NextRequest } from 'next/server'

import { env } from '~/env'
import type { WorkosUserSnapshot } from '~/server/services/UserSyncService'

import { clientIpFromHeaders } from './clientIp'

function workosUserFromAuthenticationResponse(authenticationResponse: {
  user: {
    id: string
    email: string
    firstName?: string | null
    lastName?: string | null
    profilePictureUrl?: string | null
  }
}): WorkosUserSnapshot {
  const u = authenticationResponse.user
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName ?? null,
    lastName: u.lastName ?? null,
    profilePictureUrl: u.profilePictureUrl ?? null
  }
}

function requestContext(req: NextRequest): { ipAddress?: string; userAgent?: string } {
  const ip = clientIpFromHeaders(req.headers)
  const ua = req.headers.get('user-agent') ?? undefined
  return {
    ipAddress: ip === 'unknown' ? undefined : ip,
    userAgent: ua
  }
}

type LooseWorkOsError = {
  message?: string
  errorCode?: string
  code?: string
  /** API body: SDK uses `rawResponse` or `rawData` depending on version / code path */
  rawResponse?: Record<string, unknown>
}

function rawPayloadFromThrown(error: Record<string, unknown>): Record<string, unknown> | undefined {
  if (typeof error.rawResponse === 'object' && error.rawResponse !== null) {
    return error.rawResponse as Record<string, unknown>
  }
  if (typeof error.rawData === 'object' && error.rawData !== null) {
    return error.rawData as Record<string, unknown>
  }
  return undefined
}

function readLooseWorkOsError(error: unknown): LooseWorkOsError | null {
  if (typeof error !== 'object' || error === null) return null
  const e = error as Record<string, unknown>
  const rawResponse = rawPayloadFromThrown(e)

  let errorCode: string | undefined
  if (typeof e.errorCode === 'string') {
    errorCode = e.errorCode
  } else if (typeof e.code === 'string') {
    errorCode = e.code
  }

  return {
    message: typeof e.message === 'string' ? e.message : undefined,
    errorCode,
    rawResponse
  }
}

/**
 * Collects stable `code` / `errorCode` values from WorkOS SDK errors and nested API bodies.
 * Prefer matching these for UX copy — API `message` is English-only (see Authentication errors + Events).
 *
 * @see https://workos.com/docs/reference/user-management/authentication-errors
 * @see https://workos.com/docs/events (e.g. authentication.magic_auth_failed → invalid_one_time_code)
 */
function collectWorkOsErrorCodes(
  error: unknown,
  seen = new WeakSet<object>(),
  depth = 0
): string[] {
  if (depth > 10 || error === null || error === undefined) return []
  if (typeof error !== 'object') return []
  if (seen.has(error)) return []
  seen.add(error)

  const acc = new Set<string>()
  const rec = error as Record<string, unknown>

  for (const key of ['code', 'errorCode'] as const) {
    const v = rec[key]
    if (typeof v === 'string' && v.length > 0) acc.add(v)
  }

  const errorField = rec.error
  if (typeof errorField === 'string' && errorField.length > 0) {
    acc.add(errorField)
  }

  const traverseNested = (value: unknown): void => {
    if (value === null || value === undefined) return
    if (Array.isArray(value)) {
      for (const item of value) {
        for (const c of collectWorkOsErrorCodes(item, seen, depth + 1)) acc.add(c)
      }
      return
    }
    if (typeof value === 'object') {
      for (const c of collectWorkOsErrorCodes(value, seen, depth + 1)) acc.add(c)
    }
  }

  for (const key of ['errors', 'rawResponse', 'rawData', 'error', 'data'] as const) {
    if (key in rec) traverseNested(rec[key])
  }

  return [...acc]
}

/** Localized copy keyed by WorkOS API error `code` values (not English `message`). */
const WORKOS_AUTH_ERROR_RU: Record<string, string> = {
  invalid_credentials: 'Неверный email или пароль.',
  invalid_one_time_code:
    'Неверный или просроченный код из письма. Проверь цифры или запроси новый код (он действует около 10 минут).',
  entity_already_exists: 'Этот email уже зарегистрирован — войди или используй другой адрес.',
  email_not_available: 'Этот email уже зарегистрирован — войди или используй другой адрес.',
  user_already_exists: 'Этот email уже зарегистрирован — войди или используй другой адрес.',
  password_pwned: 'Этот пароль замечен в утечках данных. Выбери другой, более уникальный пароль.',
  passwordpwned: 'Этот пароль замечен в утечках данных. Выбери другой, более уникальный пароль.',
  password_too_short:
    'Пароль слишком короткий. WorkOS требует более длинный пароль — попробуй от 12 символов.',
  passwordtooshort:
    'Пароль слишком короткий. WorkOS требует более длинный пароль — попробуй от 12 символов.',
  password_too_long: 'Пароль слишком длинный. Сократи его и попробуй снова.',
  passwordtoolong: 'Пароль слишком длинный. Сократи его и попробуй снова.',
  password_too_weak:
    'Пароль слишком простой. Добавь буквы, цифры и символы или сделай его длиннее.',
  passwordtooweak: 'Пароль слишком простой. Добавь буквы, цифры и символы или сделай его длиннее.',
  password_contains_email: 'Пароль не должен содержать email.',
  passwordcontainsemail: 'Пароль не должен содержать email.',
  password_missing_character_type:
    'Пароль должен содержать разные типы символов (буквы, цифры или спецсимволы).',
  passwordmissingcharactertype:
    'Пароль должен содержать разные типы символов (буквы, цифры или спецсимволы).',
  password_history_violation: 'Нельзя повторять один из недавних паролей. Придумай новый.',
  password_history_reused: 'Нельзя повторять один из недавних паролей. Придумай новый.'
}

function isDuplicateUserErrorCode(code: string): boolean {
  return (
    code === 'entity_already_exists' ||
    code === 'email_not_available' ||
    code === 'user_already_exists' ||
    code.includes('already_exists') ||
    (code.includes('already') && (code.includes('user') || code.includes('email')))
  )
}

function mapDuplicateUserError(codes: string[]): string | undefined {
  if (codes.some(isDuplicateUserErrorCode)) {
    return WORKOS_AUTH_ERROR_RU.entity_already_exists
  }
  return undefined
}

function isPasswordValidationErrorCode(code: string): boolean {
  return code.includes('password')
}

function mapPasswordValidationError(codes: string[]): string | undefined {
  const passwordCodes = codes.filter(isPasswordValidationErrorCode)
  if (passwordCodes.length === 0) return undefined

  for (const code of passwordCodes) {
    const mapped = WORKOS_AUTH_ERROR_RU[code]
    if (mapped) return mapped
  }

  return 'Пароль не соответствует требованиям безопасности. Сделай его длиннее и сложнее.'
}

/**
 * HTTP status on WorkOS SDK errors (`GenericServerException.status`, etc.).
 * Used only when structured `code` / `error` fields were not extracted — prefer codes from `rawData`.
 *
 * @see https://workos.com/docs/reference/errors
 */
function readWorkOsHttpStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const s = (error as Record<string, unknown>).status
  return typeof s === 'number' && Number.isFinite(s) ? s : undefined
}

function mapWorkOsHttpStatusToUserMessage(status: number): string | undefined {
  switch (status) {
    // Failed authenticate* often returns 400; prefer matching `code` in rawData above this fallback.
    case 400:
      return 'Запрос не принят. Проверь email и пароль или код из письма.'
    // Docs: 401 often means invalid API key; end users rarely see misconfigured keys.
    case 401:
      return 'Не удалось выполнить вход. Попробуй ещё раз или позже.'
    case 403:
      return 'Доступ к этому действию запрещён.'
    case 404:
      return 'Запрошенный ресурс не найден.'
    case 409:
      return 'Этот email уже зарегистрирован — войди или используй другой адрес.'
    case 422:
      return 'Данные не прошли проверку. Проверь ввод.'
    case 429:
      return 'Слишком много запросов. Подожди немного и попробуй снова.'
    default:
      if (status >= 500) {
        return 'Сервис авторизации временно недоступен. Попробуй позже.'
      }
      return undefined
  }
}

function extractPendingAuthenticationToken(error: unknown): string | null {
  const loose = readLooseWorkOsError(error)
  const raw = loose?.rawResponse
  const pending =
    raw?.pending_authentication_token ??
    raw?.pendingAuthenticationToken ??
    (raw?.errors as Array<{ pending_authentication_token?: string }> | undefined)?.[0]
      ?.pending_authentication_token
  if (typeof pending === 'string') return pending
  const encoded = JSON.stringify(error)
  const match = /pending_authentication_token["']?\s*:\s*["']([^'"]+)["']/.exec(encoded)
  return match?.[1] ?? null
}

export function mapAuthKitErrorToMessage(error: unknown): string {
  const codes = collectWorkOsErrorCodes(error).map(c => c.toLowerCase())

  for (const code of codes) {
    const mapped = WORKOS_AUTH_ERROR_RU[code]
    if (mapped) return mapped
  }

  const duplicateUser = mapDuplicateUserError(codes)
  if (duplicateUser) return duplicateUser

  const passwordValidation = mapPasswordValidationError(codes)
  if (passwordValidation) return passwordValidation

  if (codes.some(c => c.includes('email_verification') || c === 'email_verification_required')) {
    return 'Подтверди email — мы отправили код.'
  }

  if (codes.some(c => c.includes('invalid_credentials') || c === 'invalid_grant')) {
    return 'Неверный email или пароль.'
  }

  if (codes.some(c => c.includes('organization_selection'))) {
    return 'Выбор организации пока только через полный вход WorkOS.'
  }

  if (codes.some(c => c.includes('mfa'))) {
    return 'Требуется MFA — заверши вход через WorkOS.'
  }

  const status = readWorkOsHttpStatus(error)
  if (codes.length === 0 && status !== undefined) {
    if (status === 422) {
      return 'Пароль или другие данные не прошли проверку. Проверь ввод.'
    }
    const byStatus = mapWorkOsHttpStatusToUserMessage(status)
    if (byStatus) return byStatus
  }

  const loose = readLooseWorkOsError(error)
  if (codes.length > 0 || loose) {
    return 'Запрос отклонён. Проверь данные и попробуй снова.'
  }

  return 'Не удалось выполнить операцию. Попробуй ещё раз.'
}

export const workOsAuthService = {
  async userExistsWithEmail(email: string): Promise<boolean> {
    const workos = getWorkOS()
    const result = await workos.userManagement.listUsers({
      email,
      limit: 1
    })
    return result.data.length > 0
  },

  async signInWithPassword(
    req: NextRequest,
    email: string,
    password: string
  ): Promise<
    { outcome: 'ok' } | { outcome: 'needs_email_verification'; pendingAuthenticationToken: string }
  > {
    const workos = getWorkOS()
    const ctx = requestContext(req)
    try {
      const authenticationResponse = await workos.userManagement.authenticateWithPassword({
        clientId: env.WORKOS_CLIENT_ID,
        email,
        password,
        ...ctx
      })
      await saveSession(authenticationResponse, req)
      return { outcome: 'ok' }
    } catch (error: unknown) {
      const pending = extractPendingAuthenticationToken(error)
      if (pending) {
        return { outcome: 'needs_email_verification', pendingAuthenticationToken: pending }
      }
      throw error
    }
  },

  async sendMagicAuth(email: string): Promise<void> {
    const workos = getWorkOS()
    await workos.userManagement.createMagicAuth({ email })
  },

  async verifyMagicAuth(req: NextRequest, email: string, code: string): Promise<void> {
    const workos = getWorkOS()
    const ctx = requestContext(req)
    const authenticationResponse = await workos.userManagement.authenticateWithMagicAuth({
      clientId: env.WORKOS_CLIENT_ID,
      email,
      code,
      ...ctx
    })
    await saveSession(authenticationResponse, req)
  },

  async verifyEmailVerification(
    req: NextRequest,
    code: string,
    pendingAuthenticationToken: string
  ): Promise<void> {
    const workos = getWorkOS()
    const ctx = requestContext(req)
    const authenticationResponse = await workos.userManagement.authenticateWithEmailVerification({
      clientId: env.WORKOS_CLIENT_ID,
      code,
      pendingAuthenticationToken,
      ...ctx
    })
    await saveSession(authenticationResponse, req)
  },

  async requestPasswordReset(email: string): Promise<void> {
    const workos = getWorkOS()
    await workos.userManagement.createPasswordReset({ email })
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const workos = getWorkOS()
    await workos.userManagement.resetPassword({
      token,
      newPassword
    })
  },

  async completeSignupWithPassword(
    req: NextRequest,
    input: { email: string; password: string; firstName: string; lastName: string }
  ): Promise<WorkosUserSnapshot> {
    const workos = getWorkOS()
    const ctx = requestContext(req)
    await workos.userManagement.createUser({
      email: input.email,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName
    })
    const authenticationResponse = await workos.userManagement.authenticateWithPassword({
      clientId: env.WORKOS_CLIENT_ID,
      email: input.email,
      password: input.password,
      ...ctx
    })
    await saveSession(authenticationResponse, req)
    return workosUserFromAuthenticationResponse(authenticationResponse)
  },

  async prepareSignupWithMagic(input: {
    email: string
    firstName: string
    lastName: string
  }): Promise<void> {
    const workos = getWorkOS()
    await workos.userManagement.createUser({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName
    })
    await workos.userManagement.createMagicAuth({ email: input.email })
  },

  async verifySignupMagic(
    req: NextRequest,
    email: string,
    code: string
  ): Promise<WorkosUserSnapshot> {
    const workos = getWorkOS()
    const ctx = requestContext(req)
    const authenticationResponse = await workos.userManagement.authenticateWithMagicAuth({
      clientId: env.WORKOS_CLIENT_ID,
      email,
      code,
      ...ctx
    })
    await saveSession(authenticationResponse, req)
    return workosUserFromAuthenticationResponse(authenticationResponse)
  }
}
