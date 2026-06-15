import 'server-only'

import type { NextRequest } from 'next/server'

import { env } from '~/env'

import { workOsAuthService } from './workOsAuthService'
import type { WorkosUserSnapshot } from '~/server/services/UserSyncService'

/** True when `AUTH_OTP_BYPASS_CODE` is configured (dev/staging only). */
export function isAuthOtpBypassEnabled(): boolean {
  return env.AUTH_OTP_BYPASS_CODE !== undefined
}

export function isAuthOtpBypassCode(code: string): boolean {
  const configured = env.AUTH_OTP_BYPASS_CODE
  return configured !== undefined && code === configured
}

function resolvePasswordForOtpBypass(flowPassword?: string): string {
  if (flowPassword) return flowPassword
  const fallback = env.AUTH_OTP_BYPASS_DEV_PASSWORD
  if (!fallback) {
    throw new Error(
      'Для обхода OTP без пароля укажи AUTH_OTP_BYPASS_DEV_PASSWORD в env (magic-only вход).'
    )
  }
  return fallback
}

type OtpVerifyInput = {
  req: NextRequest
  code: string
  email: string
  mode: 'magic' | 'email_verify'
  bypassAuthPassword?: string
  pendingAuthenticationToken?: string
}

/** Sign-in code step: real OTP or configured bypass code. */
export async function completeSignInAfterOtp(input: OtpVerifyInput): Promise<void> {
  if (isAuthOtpBypassCode(input.code)) {
    const password = resolvePasswordForOtpBypass(input.bypassAuthPassword)
    await workOsAuthService.authenticateAfterOtpBypass(input.req, input.email, {
      password,
      setPasswordOnUser: input.bypassAuthPassword === undefined
    })
    return
  }

  if (input.mode === 'magic') {
    await workOsAuthService.verifyMagicAuth(input.req, input.email, input.code)
    return
  }

  const pending = input.pendingAuthenticationToken
  if (!pending) {
    throw new Error('Missing pending authentication token for email verification.')
  }

  await workOsAuthService.verifyEmailVerification(input.req, input.code, pending)
}

/** Signup code step: real OTP or configured bypass code. */
export async function completeSignupAfterOtp(input: OtpVerifyInput): Promise<WorkosUserSnapshot> {
  if (isAuthOtpBypassCode(input.code)) {
    const password = resolvePasswordForOtpBypass(input.bypassAuthPassword)
    return workOsAuthService.authenticateAfterOtpBypass(input.req, input.email, {
      password,
      setPasswordOnUser: input.bypassAuthPassword === undefined
    })
  }

  if (input.mode === 'email_verify') {
    const pending = input.pendingAuthenticationToken
    if (!pending) {
      throw new Error('Missing pending authentication token for email verification.')
    }
    return workOsAuthService.verifyEmailVerification(input.req, input.code, pending)
  }

  return workOsAuthService.verifySignupMagic(input.req, input.email, input.code)
}
