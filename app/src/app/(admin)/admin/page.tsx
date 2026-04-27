import { db } from '~/server/db'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import AdminStatGrid from '~/features/admin/dashboard/AdminStatGrid'

/**
 * Admin dashboard. Server-rendered counts only — keeps the first paint fast
 * and avoids a tRPC roundtrip for what is effectively a static-shape page.
 */
export default async function AdminDashboardPage() {
  const stats = await loadStats()
  return (
    <>
      <AdminPageHeader
        title="Дашборд"
        subtitle="Снимок состояния платформы. Нажимай «Уточнить» в каждом разделе."
      />
      <AdminStatGrid stats={stats} />
    </>
  )
}

async function loadStats() {
  const [users, banned, courses, drafts, tasks, contentPages, achievements, openComments] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { bannedUntil: { gt: new Date() } } }),
      db.course.count(),
      db.course.count({ where: { status: 'DRAFT' } }),
      db.courseTask.count(),
      db.contentPage.count(),
      db.achievement.count(),
      db.comment.count()
    ])
  return [
    { label: 'Пользователи', value: users, hint: `${banned} в бане` },
    { label: 'Курсы', value: courses, hint: `${drafts} в черновиках` },
    { label: 'Задачи', value: tasks, hint: 'все модули' },
    { label: 'Контент-страницы', value: contentPages, hint: 'футер + хедер' },
    { label: 'Достижения', value: achievements, hint: 'каталог' },
    { label: 'Комментарии', value: openComments, hint: 'опубликовано' }
  ]
}
