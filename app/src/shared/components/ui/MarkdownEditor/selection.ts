/**
 * Pure helpers that mutate a `<textarea>` value in selection-aware ways.
 * Encapsulates the (small but error-prone) cursor math so toolbar buttons
 * stay declarative.
 */

export interface EditResult {
  value: string
  selectionStart: number
  selectionEnd: number
}

/** Wraps the current selection with `before` / `after` markers (e.g. `**bold**`). */
export function wrapSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after: string,
  placeholder = ''
): EditResult {
  const selected = value.slice(selectionStart, selectionEnd) || placeholder
  const next = `${value.slice(0, selectionStart)}${before}${selected}${after}${value.slice(selectionEnd)}`
  return {
    value: next,
    selectionStart: selectionStart + before.length,
    selectionEnd: selectionStart + before.length + selected.length
  }
}

/** Inserts `snippet` at the cursor; collapses any existing selection. */
export function insertAtCursor(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  snippet: string
): EditResult {
  const next = `${value.slice(0, selectionStart)}${snippet}${value.slice(selectionEnd)}`
  const cursor = selectionStart + snippet.length
  return { value: next, selectionStart: cursor, selectionEnd: cursor }
}

/**
 * Adds `prefix` to every line in the selection. Uses the start of the line
 * containing `selectionStart` so partial selections still get full lines
 * prefixed (matches how editors typically handle list/blockquote toggles).
 */
export function applyLinePrefix(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string
): EditResult {
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
  const lineEnd = (() => {
    const idx = value.indexOf('\n', selectionEnd)
    return idx === -1 ? value.length : idx
  })()
  const block = value.slice(lineStart, lineEnd)
  const prefixed = block
    .split('\n')
    .map(line => (line.length > 0 ? `${prefix}${line}` : prefix.trimEnd()))
    .join('\n')
  const next = `${value.slice(0, lineStart)}${prefixed}${value.slice(lineEnd)}`
  return {
    value: next,
    selectionStart: lineStart,
    selectionEnd: lineStart + prefixed.length
  }
}

/** Wraps the selection (or whole document) in a fenced code block. */
export function wrapAsCodeBlock(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  language = ''
): EditResult {
  const fence = '```'
  const before = `${fence}${language}\n`
  const after = `\n${fence}`
  return wrapSelection(value, selectionStart, selectionEnd, before, after, 'код')
}
