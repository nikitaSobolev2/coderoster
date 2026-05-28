import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'

import { sanitizeLivechatBody, sanitizeMarkdown, sanitizePlainText } from './sanitize'

describe('sanitizePlainText', () => {
  it('sanitize_strips_script_tags', () => {
    const safe = faker.lorem.sentence()
    const input = `${safe} <script>alert(1)</script>`
    const output = sanitizePlainText(input)
    expect(output).not.toContain('<script>')
    expect(output).toContain(safe.trim().split('.')[0]!)
  })

  it('sanitize_keeps_emoji_and_unicode', () => {
    expect(sanitizePlainText('☺ Привет')).toBe('☺ Привет')
  })

  it('sanitize_returns_empty_for_only_whitespace', () => {
    expect(sanitizePlainText('   ')).toBe('')
  })
})

describe('sanitizeMarkdown', () => {
  it('keeps_allowed_inline_tags', () => {
    const output = sanitizeMarkdown('<p>hello <strong>world</strong></p>')
    expect(output).toContain('<strong>world</strong>')
  })

  it('strips_disallowed_tags', () => {
    const output = sanitizeMarkdown('<p>x</p><iframe src="//x">.</iframe>')
    expect(output).not.toContain('<iframe')
  })
})

describe('sanitizeLivechatBody', () => {
  it('always_strips_html', () => {
    expect(sanitizeLivechatBody('<b>hi</b>')).toBe('hi')
  })

  it('normalises_crlf_to_lf', () => {
    expect(sanitizeLivechatBody('a\r\nb')).toBe('a\nb')
  })

  it('drops_null_bytes', () => {
    expect(sanitizeLivechatBody('foo\u0000bar')).toBe('foobar')
  })
})
