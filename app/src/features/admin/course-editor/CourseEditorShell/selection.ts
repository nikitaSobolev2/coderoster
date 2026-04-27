export type EditorSelection =
  | { kind: 'course' }
  | { kind: 'module'; moduleId: string }
  | { kind: 'task'; moduleId: string; taskId: string }
