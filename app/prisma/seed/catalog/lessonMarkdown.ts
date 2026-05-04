/** Стандартная разметка описания задачи для каталога (RU). */
export function buildLessonBody(taskDescription: string, outputFormat: string): string {
  return [
    '## Краткое описание задачи',
    '',
    taskDescription.trim(),
    '',
    '## Формат вывода',
    '',
    outputFormat.trim(),
    '',
    '## Языки',
    '',
    'Решение на **Python** или **PHP**. Стартовый код читает ввод; не удаляй блок ввода.'
  ].join('\n')
}
