import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './styles.module.scss'

export interface Props {
  /** Markdown source. Already sanitized at write time; render is escape-safe. */
  source: string
  /** Adds top-level prose typography. Disable when caller controls layout. */
  unstyled?: boolean
}

/**
 * Shared markdown renderer used by course detail bodies, lesson task panes,
 * `/p/[slug]` content pages and admin live previews. Centralised so prose
 * typography stays consistent and sanitization rules can evolve in one place.
 */
export default function Markdown({ source, unstyled = false }: Props) {
  return (
    <div className={unstyled ? styles.markdown_unstyled : styles.markdown}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href ?? '#'} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          )
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
