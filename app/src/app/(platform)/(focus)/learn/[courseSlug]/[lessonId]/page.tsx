import { notFound } from 'next/navigation'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { HydrateClient, api } from '~/trpc/server'
import InCourseShell from '~/features/platform/in-course/InCourseShell'

interface PageProps {
  params: Promise<{ courseSlug: string; lessonId: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { courseSlug, lessonId } = await params
  const lesson = await api.lesson.getOne({ courseSlug, lessonId })
  if (!lesson) return { title: 'Урок не найден — CodeRoster' }
  return { title: `${lesson.title} · ${lesson.courseTitle} — CodeRoster` }
}

export default async function InCoursePage({ params }: PageProps) {
  const { courseSlug, lessonId } = await params
  const [course, lesson] = await Promise.all([
    api.course.getBySlug({ slug: courseSlug }),
    api.lesson.getOne({ courseSlug, lessonId })
  ])
  if (!course || !lesson) notFound()

  let isAuthenticated = false
  let completedLessonIds: string[] = []
  try {
    const session = await withAuth()
    if (session.user) {
      isAuthenticated = true
      const enrollment = await api.enrollment.getMine({ courseSlug })
      completedLessonIds = enrollment?.completedLessonIds ?? []
    }
  } catch {
    isAuthenticated = false
  }

  return (
    <HydrateClient>
      <InCourseShell
        course={course}
        lesson={lesson}
        isAuthenticated={isAuthenticated}
        initialCompletedLessonIds={completedLessonIds}
      />
    </HydrateClient>
  )
}
