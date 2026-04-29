import 'server-only'
import sanitizeHtml from 'sanitize-html'
import { env } from '~/env'

const MARKDOWN_ALLOWED_TAGS = [
  'b',
  'i',
  'em',
  'strong',
  'a',
  'p',
  'br',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6'
]

const PLAIN_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {}
}

const MARKDOWN_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: MARKDOWN_ALLOWED_TAGS,
  allowedAttributes: {
    a: ['href', 'title']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  disallowedTagsMode: 'discard'
}

/** Strips every HTML tag — used for short profile fields and comments. */
export function sanitizePlainText(value: string): string {
  if (!env.SANITIZE_MARKDOWN) return value
  return sanitizeHtml(value, PLAIN_TEXT_OPTIONS).trim()
}

/** Keeps a small subset of formatting tags safe for stored markdown bodies. */
export function sanitizeMarkdown(value: string): string {
  if (!env.SANITIZE_MARKDOWN) return value
  return sanitizeHtml(value, MARKDOWN_OPTIONS)
}

/** Chat bodies are plain text only — always strip HTML regardless of SANITIZE_MARKDOWN. */
export function sanitizeLivechatBody(value: string): string {
  const stripped = sanitizeHtml(value, PLAIN_TEXT_OPTIONS)
    .trim()
    .replace(/\u0000/g, '')
  return stripped.replace(/\r\n/g, '\n')
}
