/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * Especially useful for Docker builds.
 */
import './src/env.js'

/**
 * Browser-facing origin of the object storage bucket. Falls back to the dev
 * MinIO host so a fresh `docker compose up` boots without extra config.
 */
const UPLOAD_URL = (() => {
  const raw = process.env.S3_PUBLIC_URL ?? 'http://localhost:9000'
  try {
    return new URL(raw)
  } catch {
    return new URL('http://localhost:9000')
  }
})()

const UPLOAD_ORIGIN = UPLOAD_URL.origin

/** Host/path pattern for `next/image` on bucket URLs (see StorageService public URLs). */
/** @type {import('next/dist/shared/lib/image-config').RemotePattern} */
const UPLOAD_IMAGE_REMOTE_PATTERN = {
  protocol: UPLOAD_URL.protocol === 'https:' ? 'https' : 'http',
  hostname: UPLOAD_URL.hostname,
  ...(UPLOAD_URL.port ? { port: UPLOAD_URL.port } : {}),
  pathname: '/**'
}

/** Linux fs notify breaks on Docker bind mounts from Windows/macOS; webpack dev uses watchOptions + WATCHPACK_POLLING. */
const isDockerDev = process.env.NEXT_DEV_IN_DOCKER === '1'

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
      `img-src 'self' data: blob: https: ${UPLOAD_ORIGIN}`,
      "font-src 'self' data: blob:",
      "worker-src 'self' blob:",
      `connect-src 'self' blob: data: https://*.workos.com ${UPLOAD_ORIGIN}`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self' https://*.workos.com"
    ].join('; ')
  }
]

/** @type {import("next").NextConfig} */
const config = {
  output: 'standalone',
  images: {
    remotePatterns: [UPLOAD_IMAGE_REMOTE_PATTERN]
  },
  experimental: {
    reactCompiler: true
  },
  ...(isDockerDev
    ? {
        watchOptions: {
          pollIntervalMs: Number(process.env.WATCH_POLL_INTERVAL_MS) || 1000
        }
      }
    : {}),
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
