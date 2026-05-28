import {
  FakeAdminAchievementsRepository,
  FakeAdminAiCodeImproveRepository,
  FakeAdminAuditRepository,
  FakeAdminCatalogRepository,
  FakeAdminChallengesRepository,
  FakeAdminCommentsRepository,
  FakeAdminContactMessagesRepository,
  FakeAdminContentPagesRepository,
  FakeAdminCourseEditorRepository,
  FakeAdminLanguagesRepository,
  FakeAdminLeaderboardRepository,
  FakeAdminPlansRepository,
  FakeAdminUsersRepository,
  FakeLivechatRepository
} from './fakeAdmin'

export interface FakeAdminBundle {
  users: FakeAdminUsersRepository
  catalog: FakeAdminCatalogRepository
  courseEditor: FakeAdminCourseEditorRepository
  contentPages: FakeAdminContentPagesRepository
  achievements: FakeAdminAchievementsRepository
  challenges: FakeAdminChallengesRepository
  leaderboard: FakeAdminLeaderboardRepository
  comments: FakeAdminCommentsRepository
  languages: FakeAdminLanguagesRepository
  audit: FakeAdminAuditRepository
  plans: FakeAdminPlansRepository
  aiCodeImprove: FakeAdminAiCodeImproveRepository
  contactMessages: FakeAdminContactMessagesRepository
  livechat: FakeLivechatRepository
}

export function buildFakeAdminBundle(): FakeAdminBundle {
  return {
    users: new FakeAdminUsersRepository(),
    catalog: new FakeAdminCatalogRepository(),
    courseEditor: new FakeAdminCourseEditorRepository(),
    contentPages: new FakeAdminContentPagesRepository(),
    achievements: new FakeAdminAchievementsRepository(),
    challenges: new FakeAdminChallengesRepository(),
    leaderboard: new FakeAdminLeaderboardRepository(),
    comments: new FakeAdminCommentsRepository(),
    languages: new FakeAdminLanguagesRepository(),
    audit: new FakeAdminAuditRepository(),
    plans: new FakeAdminPlansRepository(),
    aiCodeImprove: new FakeAdminAiCodeImproveRepository(),
    contactMessages: new FakeAdminContactMessagesRepository(),
    livechat: new FakeLivechatRepository()
  }
}
