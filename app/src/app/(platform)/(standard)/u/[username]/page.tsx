import { notFound } from 'next/navigation'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { HydrateClient, api } from '~/trpc/server'
import type { CourseShowcase } from '~/server/repositories/types'
import ProfileHeader from '~/features/platform/profile/ProfileHeader'
import ActivityHeatmap from '~/features/platform/profile/ActivityHeatmap'
import AchievementsGrid from '~/features/platform/profile/AchievementsGrid'
import CoursesShowcase from '~/features/platform/profile/CoursesShowcase'
import ProfileComments from '~/features/platform/profile/ProfileComments'
import styles from './styles.module.scss'
import { pageTitle, SITE_NAME } from '~/shared/constants/site'

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params
  const profile = await api.profile.getByUsername({ username })
  if (!profile) return { title: pageTitle('Профиль не найден') }
  return {
    title: `${profile.displayName} (@${profile.username}) — ${SITE_NAME}`,
    description: profile.bio
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params
  const profile = await api.profile.getByUsername({ username })
  if (!profile) notFound()

  const year = new Date().getUTCFullYear()
  const [activity, achievements] = await Promise.all([
    api.profile.getActivity({ username, year }),
    api.profile.getAchievements({ username }),
    api.comment.listOnProfile.prefetch({ username, cursor: null })
  ])

  let isAuthenticated = false
  let showcase: { active: CourseShowcase[]; finished: CourseShowcase[] } = {
    active: [],
    finished: []
  }
  try {
    const session = await withAuth()
    if (session.user) {
      isAuthenticated = true
      if (profile.isOwner) {
        showcase = await api.enrollment.myShowcase()
      }
    }
  } catch {
    isAuthenticated = false
  }

  return (
    <HydrateClient>
      <div className={styles.page}>
        <ProfileHeader profile={profile} />
        <div className={styles.page__grid}>
          <div className={styles.page__left}>
            <ActivityHeatmap username={username} initialCells={activity} initialYear={year} />
            <AchievementsGrid achievements={achievements} />
            <CoursesShowcase active={showcase.active} finished={showcase.finished} />
          </div>
          <div className={styles.page__right}>
            <ProfileComments username={username} isAuthenticated={isAuthenticated} />
          </div>
        </div>
      </div>
    </HydrateClient>
  )
}
