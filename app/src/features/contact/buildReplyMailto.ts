/**
 * Opens default mail client with a quoted excerpt (admin reply flow).
 */
export function buildContactReplyMailto(email: string, messageExcerpt: string): string {
  const trimmed = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return '#'
  }
  const subject = encodeURIComponent('Re: сообщение с сайта Кодиум')
  const body = encodeURIComponent(
    `Здравствуйте!\n\n--- текст обращения ---\n${messageExcerpt.slice(0, 4000)}`
  )
  return `mailto:${trimmed}?subject=${subject}&body=${body}`
}
