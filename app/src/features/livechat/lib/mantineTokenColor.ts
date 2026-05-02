'use client'

import type { MantineTheme } from '@mantine/core'

import {
  LIVECHAT_DEFAULT_USERNAME_COLOR,
  LIVECHAT_USERNAME_COLOR_SWATCHES,
  type LivechatUsernameColorToken
} from '~/shared/constants/livechatColors'

/** Maps Mantine palette tokens such as `cyan.6` to hex using the active theme. */
export function mantineTokenToHex(theme: MantineTheme, token: string): string | undefined {
  const parts = token.split('.')
  const name = parts[0]
  const shadeRaw = parts[1]
  if (!name || shadeRaw === undefined) return undefined
  const shade = Number.parseInt(shadeRaw, 10)
  if (Number.isNaN(shade)) return undefined
  if (!(name in theme.colors)) return undefined
  const palettes = theme.colors as Record<string, readonly string[] | undefined>
  const palette = palettes[name]
  if (!palette) return undefined
  const idx = Math.min(Math.max(shade, 0), palette.length - 1)
  return palette[idx]
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) {
    h = h
      .split('')
      .map(c => c + c)
      .join('')
  }
  if (h.length !== 6) return null
  const n = Number.parseInt(h, 16)
  if (Number.isNaN(n)) return null
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/**
 * Maps any hex (eyedropper, pasted value) to the closest allowed livechat palette token.
 * Exact swatch clicks stay identical; arbitrary colors snap to nearest theme swatch for API validity.
 */
export function nearestLivechatUsernameToken(
  theme: MantineTheme,
  hexColor: string
): LivechatUsernameColorToken {
  const rgb = hexToRgb(hexColor)
  if (!rgb) return LIVECHAT_DEFAULT_USERNAME_COLOR

  let best: LivechatUsernameColorToken = LIVECHAT_DEFAULT_USERNAME_COLOR
  let bestDistance = Infinity

  for (const token of LIVECHAT_USERNAME_COLOR_SWATCHES) {
    const swatchHex = mantineTokenToHex(theme, token)
    if (!swatchHex) continue
    const trgb = hexToRgb(swatchHex)
    if (!trgb) continue
    const distance = (rgb.r - trgb.r) ** 2 + (rgb.g - trgb.g) ** 2 + (rgb.b - trgb.b) ** 2
    if (distance < bestDistance) {
      bestDistance = distance
      best = token
    }
  }

  return best
}
