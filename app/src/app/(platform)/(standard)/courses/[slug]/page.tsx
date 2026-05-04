import { notFound } from 'next/navigation'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { HydrateClient, api } from '~/trpc/server'
import CourseHeader from '~/features/platform/course-detail/CourseHeader'
import CourseOutcomes from '~/features/platform/course-detail/CourseOutcomes'
import CourseSyllabus from '~/features/platform/course-detail/CourseSyllabus'
import CourseEnrollPanel from '~/features/platform/course-detail/CourseEnrollPanel'
import styles from './styles.module.scss'
import { pageTitle, SITE_NAME } from '~/shared/constants/site'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const course = await api.course.getBySlug({ slug })
  if (!course) return { title: pageTitle('Курс не найден') }
  return {
    title: `${course.title} — ${SITE_NAME}`,
    description: course.description
  }
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params
  const course = await api.course.getBySlug({ slug })
  if (!course) notFound()

  let enrollment = null
  let isAuthenticated = false
  let viewerTier = 0
  let canEditCourse = false
  try {
    const session = await withAuth()
    if (session.user) {
      isAuthenticated = true
      const [mine, plan, manage] = await Promise.all([
        api.enrollment.getMine({ courseSlug: slug }),
        api.plan.getMine(),
        api.course.canManageBySlug({ slug })
      ])
      enrollment = mine
      viewerTier = plan?.tierLevel ?? 0
      canEditCourse = manage.canEdit
    }
  } catch {
    isAuthenticated = false
  }

  return (
    <HydrateClient>
      <article className={styles.page}>
        <div className={styles.page__main}>
          <CourseHeader course={course} canEdit={canEditCourse} />
          <CourseOutcomes
            longDescription={course.longDescription}
            outcomes={course.learningOutcomes}
          />
          <CourseSyllabus
            course={course}
            enrollment={enrollment}
            viewerEffectiveTier={viewerTier}
          />
        </div>
        <div id="course-enroll" className={styles.page__rail}>
          <CourseEnrollPanel course={course} isAuthenticated={isAuthenticated} />
        </div>
      </article>
    </HydrateClient>
  )
}
