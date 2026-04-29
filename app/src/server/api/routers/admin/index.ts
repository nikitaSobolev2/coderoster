import { createTRPCRouter } from '~/server/api/trpc'
import { adminUsersRouter } from './users'
import { adminCatalogRouter } from './catalog'
import { adminCourseEditorRouter } from './courseEditor'
import { adminContentPagesRouter } from './contentPages'
import { adminAchievementsRouter } from './achievements'
import { adminChallengesRouter } from './challenges'
import { adminCommentsRouter, adminLeaderboardRouter } from './moderation'
import { adminLanguagesRouter } from './languages'
import { adminAuditRouter } from './audit'
import { adminLivechatRouter } from './livechat'

/**
 * `admin.*` namespace. Every procedure inside is `adminProcedure`-gated and
 * audit-logged. Sub-routers map 1:1 to admin pages under `app/src/app/(admin)`.
 */
export const adminRouter = createTRPCRouter({
  users: adminUsersRouter,
  catalog: adminCatalogRouter,
  courseEditor: adminCourseEditorRouter,
  contentPages: adminContentPagesRouter,
  achievements: adminAchievementsRouter,
  challenges: adminChallengesRouter,
  leaderboard: adminLeaderboardRouter,
  comments: adminCommentsRouter,
  languages: adminLanguagesRouter,
  audit: adminAuditRouter,
  livechat: adminLivechatRouter
})
