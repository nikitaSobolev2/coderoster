'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { Language } from '~/server/repositories/types'
import { ensureMonacoLoaderConfigured } from './monaco-bootstrap'
import styles from './styles.module.scss'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className={styles.editor__loading}>Загружаем редактор…</div>
})

export interface Props {
  value: string
  onChange: (next: string) => void
  language: Language
  readOnly?: boolean
  /** Overrides {@link language} → Monaco grammar (e.g. `json` while streaming model output). */
  monacoLanguageId?: string
}

const MONACO_LANGUAGE_BY_APP_LANGUAGE: Record<Language, string> = {
  python: 'python',
  php: 'php'
}

/**
 * Thin wrapper around `@monaco-editor/react` matching the platform palette.
 * Loaded lazily on the client because the Monaco bundle is heavy.
 */
export default function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  monacoLanguageId
}: Props) {
  useEffect(() => {
    ensureMonacoLoaderConfigured()
  }, [])

  return (
    <div className={styles.editor}>
      <MonacoEditor
        value={value}
        language={monacoLanguageId ?? MONACO_LANGUAGE_BY_APP_LANGUAGE[language]}
        theme="vs-dark"
        onChange={next => {
          if (readOnly) return
          const raw = next ?? ''
          if (raw === value) return
          onChange(raw)
        }}
        options={{
          readOnly,
          fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          tabSize: 4,
          wordWrap: 'on',
          smoothScrolling: true,
          renderLineHighlight: 'all',
          automaticLayout: true
        }}
      />
    </div>
  )
}
