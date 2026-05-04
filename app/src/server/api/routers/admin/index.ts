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
import { adminPlansRouter } from './plans'
import { adminAiCodeImproveRouter } from './aiCodeImprove'
import { adminContactMessagesRouter } from './contactMessages'

/**
 * `admin.*` namespace: procedures use `adminProcedure`, `moderatorProcedure`, or
 * `authorStaffProcedure` per route — see [`procedures.ts`](./procedures.ts). UI nav
 * filters by role; server remains authoritative.
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
  livechat: adminLivechatRouter,
  plans: adminPlansRouter,
  aiCodeImprove: adminAiCodeImproveRouter,
  contactMessages: adminContactMessagesRouter
})
