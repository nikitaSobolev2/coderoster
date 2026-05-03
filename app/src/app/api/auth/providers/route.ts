import { NextResponse } from 'next/server'

import { env } from '~/env'

export async function GET() {
  const providers: { key: string; label: string }[] = []

  if (env.NEXT_PUBLIC_AUTH_OAUTH_GOOGLE) {
    providers.push({ key: 'google', label: 'Google' })
  }
  if (env.NEXT_PUBLIC_AUTH_OAUTH_GITHUB) {
    providers.push({ key: 'github', label: 'GitHub' })
  }
  if (env.NEXT_PUBLIC_AUTH_OAUTH_MICROSOFT) {
    providers.push({ key: 'microsoft', label: 'Microsoft' })
  }
  if (env.NEXT_PUBLIC_AUTH_OAUTH_APPLE) {
    providers.push({ key: 'apple', label: 'Apple' })
  }

  return NextResponse.json({
    /** Every OAuth tile uses hosted AuthKit where enabled connections come from WorkOS dashboard */
    hostedEntryPath: '/auth/workos/start',
    providers
  })
}
