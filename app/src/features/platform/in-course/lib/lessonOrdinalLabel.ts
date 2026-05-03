import type { CourseDetail } from '~/server/repositories/types'

/**
 * Stable human label `{module}.{task}` matching task order within published course modules.
 */
export function lessonOrdinalLabel(course: CourseDetail, lessonId: string): string | null {
  const modules = course.modules
  for (let mi = 0; mi < modules.length; mi++) {
    const lessons = modules[mi]!.lessons
    const li = lessons.findIndex(l => l.id === lessonId)
    if (li !== -1) {
      return `${mi + 1}.${li + 1}`
    }
  }
  return null
}
