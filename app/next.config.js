/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * Especially useful for Docker builds.
 */
import './src/env.js'

const SECURITY_HEADERS = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.workos.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: blob:",
      "worker-src 'self' blob:",
      "connect-src 'self' blob: data: https://*.workos.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self' https://*.workos.com"
    ].join('; ')
  }
]

/** @type {import("next").NextConfig} */
const config = {
  output: 'standalone',
  experimental: {
    reactCompiler: true
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS
      }
    ]
  }
}

export default config
