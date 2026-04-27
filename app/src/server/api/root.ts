import { courseRouter } from '~/server/api/routers/course'
import { lessonRouter } from '~/server/api/routers/lesson'
import { enrollmentRouter } from '~/server/api/routers/enrollment'
import { progressRouter } from '~/server/api/routers/progress'
import { executionRouter } from '~/server/api/routers/execution'
import { profileRouter } from '~/server/api/routers/profile'
import { settingsRouter } from '~/server/api/routers/settings'
import { commentRouter } from '~/server/api/routers/comment'
import { searchRouter } from '~/server/api/routers/search'
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
  search: searchRouter
})

export type AppRouter = typeof appRouter

export const createCaller = createCallerFactory(appRouter)
