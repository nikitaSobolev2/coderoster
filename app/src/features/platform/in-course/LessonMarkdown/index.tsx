import { Fragment } from 'react'
import styles from './styles.module.scss'

export interface Props {
  source: string
  /**
   * When the task pane is narrow, the wide `h1` is hidden — skip the opening `##` / `###`
   * block when it would duplicate LeetCode-style headings under the caption rail.
   */
  suppressFirstLeadHeading?: boolean
}

/**
 * Minimal markdown renderer for lesson bodies. Supports `##` headings,
 * paragraphs, inline `**bold**` and inline `` `code` ``. Avoids pulling in a
 * full markdown dependency for the small subset our fixtures use.
 */
export default function LessonMarkdown({ source, suppressFirstLeadHeading = false }: Props) {
  let blocks = source.split(/\n{2,}/)
  if (suppressFirstLeadHeading && blocks.length > 0) {
    const lead = blocks[0]?.trim()
    if (lead?.startsWith('## ') || lead?.startsWith('### ')) {
      blocks = blocks.slice(1)
    }
  }
  return (
    <div className={styles.md}>
      {blocks.map((block, index) => (
        <Fragment key={index}>{renderBlock(block)}</Fragment>
      ))}
    </div>
  )
}

function renderBlock(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('## ')) {
    return <h2 className={styles.md__h2}>{renderInline(trimmed.slice(3))}</h2>
  }
  if (trimmed.startsWith('### ')) {
    return <h3 className={styles.md__h3}>{renderInline(trimmed.slice(4))}</h3>
  }
  return <p className={styles.md__p}>{renderInline(trimmed)}</p>
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const pattern = /\*\*([^*]+)\*\*|`([^`]+)`/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let cursor = 0
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={cursor++}>{match[1]}</strong>)
    } else if (match[2] !== undefined) {
      parts.push(
        <code key={cursor++} className={styles.md__code}>
          {match[2]}
        </code>
      )
    }
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}
