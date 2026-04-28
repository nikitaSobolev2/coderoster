import { notFound, redirect } from 'next/navigation'
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

/**
 * The in-course experience is auth-only by design — it stores drafts, runs
 * code in the user's sandbox, and tracks XP. Even though the WorkOS
 * middleware already gates `/learn/*`, we re-check here so RSC navigations
 * and prefetches that bypass the middleware still get a hard redirect to
 * the login flow instead of rendering a half-broken editor.
 */
export default async function InCoursePage({ params }: PageProps) {
  const { courseSlug, lessonId } = await params
  const session = await withAuth()
  if (!session.user) redirect('/login')

  const [course, lesson] = await Promise.all([
    api.course.getBySlug({ slug: courseSlug }),
    api.lesson.getOne({ courseSlug, lessonId })
  ])
  if (!course || !lesson) notFound()

  const enrollment = await api.enrollment.getMine({ courseSlug })
  const completedLessonIds = enrollment?.completedLessonIds ?? []

  return (
    <HydrateClient>
      <InCourseShell
        course={course}
        lesson={lesson}
        isAuthenticated
        initialCompletedLessonIds={completedLessonIds}
      />
    </HydrateClient>
  )
}
