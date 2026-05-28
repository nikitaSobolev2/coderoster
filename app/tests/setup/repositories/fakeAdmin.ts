import { faker } from '@faker-js/faker'
import type {
  AdminUserListQuery,
  AdminUserListResult,
  AdminUserRoleInput,
  AdminUserSummary,
  ModerationUserListResult,
  ModerationUserSummary
} from '~/server/repositories/admin/users.repository'
import type {
  AdminPlanCreateInput,
  AdminPlanRow,
  AdminPlanUpdateInput
} from '~/server/repositories/admin/plans.repository'
import {
  type AuditEntry,
  auditEntryFactory,
  type ContentPage,
  contentPageFactory,
  type ContactMessage,
  contactMessageFactory
} from '../fixtures/adminFactory'
import type { LivechatMessageDTO } from '~/server/livechat/livechat.repository'
import { livechatMessageFactory } from '../fixtures/livechatFactory'

/**
 * In-memory Fake repositories for every admin-domain repository and the
 * livechat repository. Closes the faker gap noted in the plan: production
 * code only ships PrismaXxx; tests reach into these classes directly.
 *
 * Repositories own their seed data and use faker for default values. Each
 * instance is independent (no module-level singleton), so tests get a clean
 * slate via `new FakeAdminUsersRepository()`.
 */

// ---------- Users ----------

export class FakeAdminUsersRepository {
  private readonly users = new Map<string, AdminUserSummary>()

  seedMany(count: number, partial: Partial<AdminUserSummary> = {}): AdminUserSummary[] {
    const created: AdminUserSummary[] = []
    for (let i = 0; i < count; i++) {
      created.push(this.seed(partial))
    }
    return created
  }

  seed(partial: Partial<AdminUserSummary> = {}): AdminUserSummary {
    const id = partial.id ?? faker.string.uuid()
    const summary: AdminUserSummary = {
      id,
      username: partial.username ?? faker.internet.username().toLowerCase(),
      displayName: partial.displayName ?? faker.person.fullName(),
      email: partial.email ?? faker.internet.email(),
      role: partial.role ?? 'LEARNER',
      totalXp: partial.totalXp ?? faker.number.int({ min: 0, max: 5000 }),
      streakDays: partial.streakDays ?? faker.number.int({ min: 0, max: 30 }),
      bannedUntil: partial.bannedUntil ?? null,
      banReason: partial.banReason ?? null,
      excludedFromLeaderboard: partial.excludedFromLeaderboard ?? false,
      joinedAt: partial.joinedAt ?? faker.date.past({ years: 1 }),
      plan: partial.plan ?? null
    }
    this.users.set(id, summary)
    return summary
  }

  async list(query: AdminUserListQuery): Promise<AdminUserListResult> {
    const limit = query.limit ?? 25
    let items = [...this.users.values()]
    if (query.role) items = items.filter(u => u.role === query.role)
    if (query.banned === 'banned') items = items.filter(u => u.bannedUntil !== null)
    if (query.banned === 'active') items = items.filter(u => u.bannedUntil === null)
    if (query.hideAdmins) items = items.filter(u => u.role !== 'ADMIN')
    if (query.q) {
      const needle = query.q.toLowerCase()
      items = items.filter(
        u =>
          u.username.toLowerCase().includes(needle) ||
          u.displayName.toLowerCase().includes(needle) ||
          u.email.toLowerCase().includes(needle)
      )
    }
    const startIndex = query.cursor ? items.findIndex(u => u.id === query.cursor) + 1 : 0
    const slice = items.slice(startIndex, startIndex + limit)
    const nextCursor =
      startIndex + limit < items.length ? (slice[slice.length - 1]?.id ?? null) : null
    return { items: slice, nextCursor, total: items.length }
  }

  async listForModeration(query: AdminUserListQuery): Promise<ModerationUserListResult> {
    const result = await this.list({ ...query, hideAdmins: true })
    const items: ModerationUserSummary[] = result.items.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: null,
      role: u.role,
      bannedUntil: u.bannedUntil,
      banReason: u.banReason,
      chatBannedUntil: null,
      chatBanReason: null,
      joinedAt: u.joinedAt
    }))
    return { items, nextCursor: result.nextCursor, total: result.total }
  }

  async updateRole(userId: string, role: AdminUserRoleInput): Promise<void> {
    const row = this.users.get(userId)
    if (!row) throw new Error('USER_NOT_FOUND')
    row.role = role
  }

  async setBan(userId: string, until: Date | null, reason: string | null): Promise<void> {
    const row = this.users.get(userId)
    if (!row) throw new Error('USER_NOT_FOUND')
    row.bannedUntil = until
    row.banReason = reason
  }

  async setChatBan(_userId: string, _until: Date | null, _reason: string | null): Promise<void> {
    /* fake: chat ban field omitted from summary on purpose */
  }
}

// ---------- Catalog ----------

export interface FakeCourseRow {
  id: string
  slug: string
  title: string
  authorId: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  order: number
  tierRequired: number
  categoryId: string | null
}

export class FakeAdminCatalogRepository {
  private readonly courses = new Map<string, FakeCourseRow>()
  private readonly categories = new Map<
    string,
    { id: string; slug: string; title: string; order: number; parentCategoryId: string | null }
  >()

  seedCourse(partial: Partial<FakeCourseRow> = {}): FakeCourseRow {
    const id = partial.id ?? faker.string.uuid()
    const row: FakeCourseRow = {
      id,
      slug: partial.slug ?? faker.helpers.slugify(faker.lorem.words(2)).toLowerCase(),
      title: partial.title ?? faker.lorem.words(3),
      authorId: partial.authorId ?? faker.string.uuid(),
      status: partial.status ?? 'DRAFT',
      order: partial.order ?? this.courses.size,
      tierRequired: partial.tierRequired ?? 0,
      categoryId: partial.categoryId ?? null
    }
    this.courses.set(id, row)
    return row
  }

  async listCourses(filter: { authoredBy?: string; cursor?: string; limit?: number } = {}) {
    const limit = filter.limit ?? 20
    let rows = [...this.courses.values()]
    if (filter.authoredBy) rows = rows.filter(r => r.authorId === filter.authoredBy)
    const start = filter.cursor ? rows.findIndex(r => r.id === filter.cursor) + 1 : 0
    const slice = rows.slice(start, start + limit)
    const nextCursor = start + limit < rows.length ? (slice[slice.length - 1]?.id ?? null) : null
    return { items: slice, nextCursor, total: rows.length }
  }

  async createCourse(input: {
    slug: string
    title: string
    authorId: string
  }): Promise<FakeCourseRow> {
    return this.seedCourse(input)
  }

  async setStatus(id: string, status: FakeCourseRow['status']): Promise<void> {
    const row = this.courses.get(id)
    if (!row) throw new Error('COURSE_NOT_FOUND')
    row.status = status
  }

  async reorderCourses(orderedIds: string[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const row = this.courses.get(id)
      if (row) row.order = index
    })
  }

  async createCategory(input: {
    slug: string
    title: string
    parentCategoryId?: string | null
  }): Promise<{ id: string; slug: string }> {
    const id = faker.string.uuid()
    this.categories.set(id, {
      id,
      slug: input.slug,
      title: input.title,
      order: this.categories.size,
      parentCategoryId: input.parentCategoryId ?? null
    })
    return { id, slug: input.slug }
  }

  async listCategories() {
    return [...this.categories.values()]
  }
}

// ---------- Course editor ----------

export interface FakeModuleRow {
  id: string
  courseId: string
  title: string
  order: number
}

export interface FakeTaskRow {
  id: string
  moduleId: string
  title: string
  order: number
  isPremium: boolean
  minPlanTier: number
  autotests: Array<{ id: string; order: number; name: string; expected: string; hidden: boolean }>
}

export class FakeAdminCourseEditorRepository {
  private readonly modules = new Map<string, FakeModuleRow>()
  private readonly tasks = new Map<string, FakeTaskRow>()

  seedModule(partial: Partial<FakeModuleRow> = {}): FakeModuleRow {
    const id = partial.id ?? faker.string.uuid()
    const row: FakeModuleRow = {
      id,
      courseId: partial.courseId ?? faker.string.uuid(),
      title: partial.title ?? faker.lorem.words(2),
      order: partial.order ?? this.modules.size
    }
    this.modules.set(id, row)
    return row
  }

  seedTask(partial: Partial<FakeTaskRow> = {}): FakeTaskRow {
    const id = partial.id ?? faker.string.uuid()
    const row: FakeTaskRow = {
      id,
      moduleId: partial.moduleId ?? faker.string.uuid(),
      title: partial.title ?? faker.lorem.words(2),
      order: partial.order ?? 0,
      isPremium: partial.isPremium ?? false,
      minPlanTier: partial.minPlanTier ?? 0,
      autotests: partial.autotests ?? []
    }
    this.tasks.set(id, row)
    return row
  }

  async load(courseId: string) {
    const modules = [...this.modules.values()].filter(m => m.courseId === courseId)
    return modules.map(m => ({
      ...m,
      tasks: [...this.tasks.values()].filter(t => t.moduleId === m.id)
    }))
  }

  async addModule(courseId: string, title: string): Promise<FakeModuleRow> {
    const siblings = [...this.modules.values()].filter(m => m.courseId === courseId)
    return this.seedModule({ courseId, title, order: siblings.length })
  }

  async addTask(moduleId: string, title: string): Promise<FakeTaskRow> {
    const siblings = [...this.tasks.values()].filter(t => t.moduleId === moduleId)
    return this.seedTask({ moduleId, title, order: siblings.length })
  }

  async reorderTasks(moduleId: string, orderedTaskIds: string[]): Promise<void> {
    orderedTaskIds.forEach((id, index) => {
      const row = this.tasks.get(id)
      if (row && row.moduleId === moduleId) row.order = index
    })
  }

  async setTaskPremium(taskId: string, isPremium: boolean): Promise<void> {
    const row = this.tasks.get(taskId)
    if (!row) throw new Error('TASK_NOT_FOUND')
    row.isPremium = isPremium
  }

  async updateAutotests(taskId: string, autotests: FakeTaskRow['autotests']): Promise<void> {
    const row = this.tasks.get(taskId)
    if (!row) throw new Error('TASK_NOT_FOUND')
    row.autotests = [...autotests]
  }
}

// ---------- Content pages ----------

export class FakeAdminContentPagesRepository {
  private readonly pages = new Map<string, ContentPage>()

  seed(partial: Partial<ContentPage> = {}): ContentPage {
    const page = contentPageFactory(partial)
    this.pages.set(page.id, page)
    return page
  }

  async list(filter: { cursor?: string; limit?: number; placement?: 'FOOTER' | 'NONE' } = {}) {
    const limit = filter.limit ?? 20
    let rows = [...this.pages.values()]
    if (filter.placement) rows = rows.filter(r => r.placement === filter.placement)
    const start = filter.cursor ? rows.findIndex(r => r.id === filter.cursor) + 1 : 0
    const slice = rows.slice(start, start + limit)
    const nextCursor = start + limit < rows.length ? (slice[slice.length - 1]?.id ?? null) : null
    return { items: slice, nextCursor, total: rows.length }
  }

  async create(input: Omit<ContentPage, 'id'>): Promise<ContentPage> {
    return this.seed(input)
  }

  async update(id: string, patch: Partial<ContentPage>): Promise<ContentPage> {
    const row = this.pages.get(id)
    if (!row) throw new Error('PAGE_NOT_FOUND')
    Object.assign(row, patch)
    return row
  }
}

// ---------- Achievements ----------

export interface FakeAchievementRow {
  id: string
  name: string
  description: string
  category: 'progression' | 'streak' | 'speed' | 'completionist' | 'hidden'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  goal: number
  hidden: boolean
}

export class FakeAdminAchievementsRepository {
  private readonly rows = new Map<string, FakeAchievementRow>()
  private readonly userTracks = new Map<string, Set<string>>()

  seed(partial: Partial<FakeAchievementRow> = {}): FakeAchievementRow {
    const id = partial.id ?? `ach-${faker.string.alphanumeric(6)}`
    const row: FakeAchievementRow = {
      id,
      name: partial.name ?? faker.lorem.words(2),
      description: partial.description ?? faker.lorem.sentence(),
      category: partial.category ?? 'progression',
      rarity: partial.rarity ?? 'common',
      goal: partial.goal ?? 1,
      hidden: partial.hidden ?? false
    }
    this.rows.set(id, row)
    return row
  }

  async create(input: Partial<FakeAchievementRow>): Promise<FakeAchievementRow> {
    return this.seed(input)
  }

  async update(id: string, patch: Partial<FakeAchievementRow>): Promise<FakeAchievementRow> {
    const row = this.rows.get(id)
    if (!row) throw new Error('ACHIEVEMENT_NOT_FOUND')
    Object.assign(row, patch)
    return row
  }

  async delete(id: string): Promise<void> {
    this.rows.delete(id)
    for (const tracked of this.userTracks.values()) tracked.delete(id)
  }

  trackForUser(userId: string, achievementId: string): void {
    const set = this.userTracks.get(userId) ?? new Set<string>()
    set.add(achievementId)
    this.userTracks.set(userId, set)
  }

  hasUserTrack(userId: string, achievementId: string): boolean {
    return this.userTracks.get(userId)?.has(achievementId) ?? false
  }
}

// ---------- Challenges ----------

export class FakeAdminChallengesRepository {
  private readonly daily = new Map<string, string[]>()
  private readonly weekly = new Map<string, string[]>()

  async setDaily(date: string, taskIds: string[]): Promise<void> {
    if (taskIds.length !== 3) throw new Error('DAILY_REQUIRES_THREE')
    this.daily.set(date, [...taskIds])
  }

  async setWeekly(isoWeek: string, taskIds: string[]): Promise<void> {
    if (taskIds.length !== 5) throw new Error('WEEKLY_REQUIRES_FIVE')
    this.weekly.set(isoWeek, [...taskIds])
  }

  async listDailyByDate(date: string): Promise<string[]> {
    return this.daily.get(date) ?? []
  }

  async listWeekly(isoWeek: string): Promise<string[]> {
    return this.weekly.get(isoWeek) ?? []
  }
}

// ---------- Moderation ----------

export interface FakeCommentRow {
  id: string
  threadId: string
  authorId: string
  body: string
  createdAt: Date
}

export class FakeAdminCommentsRepository {
  private readonly comments = new Map<string, FakeCommentRow>()

  seed(partial: Partial<FakeCommentRow> = {}): FakeCommentRow {
    const id = partial.id ?? faker.string.uuid()
    const row: FakeCommentRow = {
      id,
      threadId: partial.threadId ?? faker.string.uuid(),
      authorId: partial.authorId ?? faker.string.uuid(),
      body: partial.body ?? faker.lorem.sentence(),
      createdAt: partial.createdAt ?? faker.date.recent({ days: 14 })
    }
    this.comments.set(id, row)
    return row
  }

  async deleteComment(commentId: string): Promise<void> {
    this.comments.delete(commentId)
  }

  async list(): Promise<FakeCommentRow[]> {
    return [...this.comments.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
}

export class FakeAdminLeaderboardRepository {
  private readonly excluded = new Set<string>()

  async toggleExclude(userId: string, excluded: boolean): Promise<void> {
    if (excluded) this.excluded.add(userId)
    else this.excluded.delete(userId)
  }

  isExcluded(userId: string): boolean {
    return this.excluded.has(userId)
  }
}

// ---------- Languages ----------

export class FakeAdminLanguagesRepository {
  private allowed: string[] = ['python', 'php']

  async list(): Promise<string[]> {
    return [...this.allowed]
  }

  async update(next: string[]): Promise<string[]> {
    this.allowed = [...next]
    return [...this.allowed]
  }
}

// ---------- Audit ----------

export class FakeAdminAuditRepository {
  private readonly entries: AuditEntry[] = []

  seed(partial: Partial<AuditEntry> = {}): AuditEntry {
    const entry = auditEntryFactory(partial)
    this.entries.push(entry)
    return entry
  }

  async list(filter: { actorId?: string; targetId?: string; limit?: number } = {}) {
    const limit = filter.limit ?? 50
    let rows = [...this.entries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    if (filter.actorId) rows = rows.filter(r => r.actorId === filter.actorId)
    if (filter.targetId) rows = rows.filter(r => r.targetId === filter.targetId)
    return rows.slice(0, limit)
  }

  async record(entry: Omit<AuditEntry, 'id' | 'createdAt'>): Promise<AuditEntry> {
    return this.seed(entry)
  }
}

// ---------- Plans ----------

export class FakeAdminPlansRepository {
  private readonly plans = new Map<string, AdminPlanRow>()

  seed(partial: Partial<AdminPlanRow> = {}): AdminPlanRow {
    const id = partial.id ?? faker.string.uuid()
    const tierLevel = partial.tierLevel ?? 0
    const row: AdminPlanRow = {
      id,
      slug: partial.slug ?? `plan-${faker.string.alphanumeric(6)}`,
      name: partial.name ?? faker.lorem.word(),
      shortDescription: partial.shortDescription ?? faker.lorem.sentence(),
      marketingMarkdown: partial.marketingMarkdown ?? '',
      marketingFeatures: partial.marketingFeatures ?? [],
      isBestseller: partial.isBestseller ?? false,
      tierLevel,
      xpBonusPercent: partial.xpBonusPercent ?? tierLevel * 10,
      sortOrder: partial.sortOrder ?? tierLevel,
      isDefaultFree: partial.isDefaultFree ?? tierLevel === 0,
      maxActiveCourses: partial.maxActiveCourses ?? (tierLevel === 0 ? 3 : null),
      userCount: partial.userCount ?? 0,
      createdAt: partial.createdAt ?? new Date(),
      updatedAt: partial.updatedAt ?? new Date()
    }
    this.plans.set(id, row)
    return row
  }

  async list(): Promise<AdminPlanRow[]> {
    return [...this.plans.values()].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.tierLevel - b.tierLevel
    )
  }

  async create(input: AdminPlanCreateInput): Promise<AdminPlanRow> {
    return this.seed(input as Partial<AdminPlanRow>)
  }

  async update(id: string, patch: AdminPlanUpdateInput): Promise<AdminPlanRow> {
    const row = this.plans.get(id)
    if (!row) throw new Error('PLAN_NOT_FOUND')
    Object.assign(row, patch)
    return row
  }

  async setDefaultFree(planId: string): Promise<AdminPlanRow> {
    for (const row of this.plans.values()) row.isDefaultFree = false
    const target = this.plans.get(planId)
    if (!target) throw new Error('PLAN_NOT_FOUND')
    target.isDefaultFree = true
    return target
  }

  async delete(id: string): Promise<void> {
    const row = this.plans.get(id)
    if (!row) return
    if (row.isDefaultFree) throw new Error('CANNOT_DELETE_DEFAULT_PLAN')
    this.plans.delete(id)
  }
}

// ---------- AI Code Improve ----------

export interface AiCodeImproveConfig {
  model: string
  apiKeyAlias: string
}

export class FakeAdminAiCodeImproveRepository {
  private config: AiCodeImproveConfig = {
    model: 'gpt-4o-mini',
    apiKeyAlias: 'AI_CODE_IMPROVE_API_KEY'
  }

  async get(): Promise<AiCodeImproveConfig> {
    return { ...this.config }
  }

  async update(patch: Partial<AiCodeImproveConfig>): Promise<AiCodeImproveConfig> {
    this.config = { ...this.config, ...patch }
    return { ...this.config }
  }
}

// ---------- Contact messages ----------

export class FakeAdminContactMessagesRepository {
  private readonly messages: ContactMessage[] = []

  seed(partial: Partial<ContactMessage> = {}): ContactMessage {
    const message = contactMessageFactory(partial)
    this.messages.push(message)
    return message
  }

  async list(filter: { source?: 'HOME' | 'PLATFORM'; limit?: number } = {}) {
    const limit = filter.limit ?? 25
    let rows = [...this.messages].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    if (filter.source) rows = rows.filter(r => r.source === filter.source)
    return rows.slice(0, limit)
  }
}

// ---------- Livechat ----------

const LIVECHAT_ALLOWED_COLORS = ['blue', 'red', 'green', 'purple', 'orange'] as const

export class FakeLivechatRepository {
  private readonly messages: LivechatMessageDTO[] = []
  private readonly guestConsents = new Set<string>()
  private readonly userColors = new Map<string, string>()
  private readonly userConsents = new Set<string>()

  seed(partial: Partial<LivechatMessageDTO> = {}): LivechatMessageDTO {
    const message = livechatMessageFactory(partial)
    this.messages.push(message)
    return message
  }

  async listRecent(limit = 50) {
    const take = Math.min(limit, 80)
    const rows = [...this.messages]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, take + 1)
    const hasMore = rows.length > take
    const slice = hasMore ? rows.slice(0, take) : rows
    const chronological = [...slice].reverse()
    return {
      items: chronological,
      nextCursorOlder: hasMore && slice[slice.length - 1] ? slice[slice.length - 1]!.id : null
    }
  }

  async listOlderThan(cursorOlderId: string | null, limit: number) {
    if (cursorOlderId !== null && !this.messages.some(m => m.id === cursorOlderId)) {
      return { items: [], nextCursorOlder: null }
    }
    const take = Math.min(Math.max(limit, 1), 80)
    const sorted = [...this.messages].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    const startIndex = cursorOlderId ? sorted.findIndex(m => m.id === cursorOlderId) + 1 : 0
    const slice = sorted.slice(startIndex, startIndex + take + 1)
    const hasMore = slice.length > take
    const cut = hasMore ? slice.slice(0, take) : slice
    return {
      items: [...cut].reverse(),
      nextCursorOlder: hasMore && cut[cut.length - 1] ? cut[cut.length - 1]!.id : null
    }
  }

  async insertAuthMessage(params: {
    userId: string
    body: string
    authorLabel: string
    usernameColor: string
  }): Promise<LivechatMessageDTO> {
    const message = livechatMessageFactory({
      body: params.body,
      authorKind: 'AUTH',
      authorLabel: params.authorLabel,
      usernameColor: params.usernameColor,
      authorProfileUsername: params.authorLabel
    })
    this.messages.push(message)
    return message
  }

  async insertGuestMessage(params: {
    guestSessionId: string
    body: string
    guestLabel: string
    usernameColor: string
  }): Promise<LivechatMessageDTO> {
    const message = livechatMessageFactory({
      body: params.body,
      authorKind: 'GUEST',
      authorLabel: params.guestLabel,
      usernameColor: params.usernameColor,
      authorProfileUsername: null
    })
    this.messages.push(message)
    return message
  }

  async guestHasConsent(guestSessionId: string): Promise<boolean> {
    return this.guestConsents.has(guestSessionId)
  }

  async recordGuestConsent(guestSessionId: string): Promise<void> {
    this.guestConsents.add(guestSessionId)
  }

  async acceptUserConsent(userId: string): Promise<void> {
    this.userConsents.add(userId)
  }

  async setUserUsernameColor(userId: string, color: string): Promise<void> {
    if (!(LIVECHAT_ALLOWED_COLORS as readonly string[]).includes(color)) {
      throw new Error('USERNAME_COLOR_NOT_ALLOWED')
    }
    this.userColors.set(userId, color)
  }

  hasUserConsent(userId: string): boolean {
    return this.userConsents.has(userId)
  }
}
