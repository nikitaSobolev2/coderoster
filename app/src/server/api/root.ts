import { courseRouter } from '~/server/api/routers/course'
import { lessonRouter } from '~/server/api/routers/lesson'
import { enrollmentRouter } from '~/server/api/routers/enrollment'
import { progressRouter } from '~/server/api/routers/progress'
import { executionRouter } from '~/server/api/routers/execution'
import { profileRouter } from '~/server/api/routers/profile'
import { settingsRouter } from '~/server/api/routers/settings'
import { commentRouter } from '~/server/api/routers/comment'
import { searchRouter } from '~/server/api/routers/search'
import { accountRouter } from '~/server/api/routers/account'
import { achievementRouter } from '~/server/api/routers/achievement'
import { sandboxRouter } from '~/server/api/routers/sandbox'
import { leaderboardRouter } from '~/server/api/routers/leaderboard'
import { dailyRouter } from '~/server/api/routers/daily'
import { weeklyRouter } from '~/server/api/routers/weekly'
import { adminRouter } from '~/server/api/routers/admin'
import { uploadRouter } from '~/server/api/routers/upload'
import { livechatRouter } from '~/server/api/routers/livechat'
import { planRouter } from '~/server/api/routers/plan'
import { codeImproveRouter } from '~/server/api/routers/codeImprove'
import { createCallerFactory, createTRPCRouter } from '~/server/api/trpc'

/**
 * Primary tRPC router. Add new sub-routers here exactly once.
 */
export const appRouter = createTRPCRouter({
  course: courseRouter,
  lesson: lessonRouter,
  enrollment: enrollmentRouter,
  progress: progressRouter,
  execution: executionRouter,
  profile: profileRouter,
  settings: settingsRouter,
  comment: commentRouter,
  search: searchRouter,
  account: accountRouter,
  achievement: achievementRouter,
  sandbox: sandboxRouter,
  leaderboard: leaderboardRouter,
  daily: dailyRouter,
  weekly: weeklyRouter,
  admin: adminRouter,
  upload: uploadRouter,
  livechat: livechatRouter,
  plan: planRouter,
  codeImprove: codeImproveRouter
})

export type AppRouter = typeof appRouter

export const createCaller = createCallerFactory(appRouter)
