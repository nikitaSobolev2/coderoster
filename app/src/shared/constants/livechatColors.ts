/**
 * Mantine theme token strings accepted for chat username colour (validated server-side too).
 */
export const LIVECHAT_USERNAME_COLOR_SWATCHES = [
  'brand.6',
  'brand.7',
  'cyan.6',
  'cyan.7',
  'grape.6',
  'green.6',
  'indigo.6',
  'lime.6',
  'orange.6',
  'pink.6',
  'red.6',
  'teal.6',
  'violet.6',
  'yellow.6',
  'gray.5',
  'gray.7'
] as const

export type LivechatUsernameColorToken = (typeof LIVECHAT_USERNAME_COLOR_SWATCHES)[number]

export const LIVECHAT_DEFAULT_USERNAME_COLOR: LivechatUsernameColorToken = 'cyan.6'
