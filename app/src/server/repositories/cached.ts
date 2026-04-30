import 'server-only'
import { cache } from '~/server/cache'
import type { CourseRepository, CourseListContext } from './course.repository'
import type { LessonRepository } from './lesson.repository'
import type { ProfileRepository } from './profile.repository'
import type { CommentRepository } from './comment.repository'
import type { SearchRepository } from './search.repository'
import type {
  ActivityCell,
  CategoryNavParentRef,
  CategoryRef,
  CourseDetail,
  CoursesPage,
  CoursesQuery,
  EarnedAchievement,
  GlobalSearchOptions,
  GlobalSearchResults,
  LessonDetail,
  ProfileCommentsPage,
  PublicProfile
} from './types'

const TTL = {
  courseList: 60,
  courseDetail: 300,
  courseCategories: 300,
  lessonDetail: 300,
  profile: 300,
  activity: 3_600,
  achievements: 300,
  comments: 60,
  search: 30
}

const KEY = {
  courseList: (q: CoursesQuery, viewerTier: number) =>
    `course:list:v4:${stable(q)}${q.matchesMyPlan ? `:vt=${viewerTier}` : ''}`,
  courseDetail: (slug: string) => `course:slug:v2:${slug}`,
  courseCategories: 'course:categories:v1',
  courseCategoriesNav: 'course:categoriesNav:v1',
  lessonDetail: (courseSlug: string, lessonId: string, viewerUserId: string | null) =>
    `lesson:${courseSlug}:${lessonId}:u:${viewerUserId ?? 'anon'}:v3`,
  profile: (username: string, viewerId: string | null) =>
    `profile:${username.toLowerCase()}:${viewerId ?? 'guest'}`,
  activity: (username: string, year: number) => `activity:${username.toLowerCase()}:${year}`,
  achievements: (username: string) => `achievements:${username.toLowerCase()}`,
  comments: (username: string, cursor: string | null) =>
    `comments:${username.toLowerCase()}:${cursor ?? 'head'}`,
  search: (query: string, options: GlobalSearchOptions) =>
    `search:${query.toLowerCase()}|auth=${options.includeAuthRoutes ? 1 : 0}`
}

export class CachedCourseRepository implements CourseRepository {
  constructor(private readonly inner: CourseRepository) {}

  async list(query: CoursesQuery, context?: CourseListContext): Promise<CoursesPage> {
    const viewerTier = context?.viewerTier ?? 0
    return cache.wrap(KEY.courseList(query, viewerTier), TTL.courseList, () =>
      this.inner.list(query, context)
    )
  }

  async getBySlug(slug: string): Promise<CourseDetail | null> {
    return cache.wrap(KEY.courseDetail(slug), TTL.courseDetail, () => this.inner.getBySlug(slug))
  }

  async listCategories(): Promise<CategoryRef[]> {
    return cache.wrap(KEY.courseCategories, TTL.courseCategories, () => this.inner.listCategories())
  }

  async listCategoriesNavTree(): Promise<CategoryNavParentRef[]> {
    return cache.wrap(KEY.courseCategoriesNav, TTL.courseCategories, () =>
      this.inner.listCategoriesNavTree()
    )
  }
}

export class CachedLessonRepository implements LessonRepository {
  constructor(private readonly inner: LessonRepository) {}

  async getOne(
    courseSlug: string,
    lessonId: string,
    viewerUserId?: string | null
  ): Promise<LessonDetail | null> {
    return cache.wrap(
      KEY.lessonDetail(courseSlug, lessonId, viewerUserId ?? null),
      TTL.lessonDetail,
      () => this.inner.getOne(courseSlug, lessonId, viewerUserId)
    )
  }
}

export class CachedProfileRepository implements ProfileRepository {
  constructor(private readonly inner: ProfileRepository) {}

  async getByUsername(
    username: string,
    viewerUserId: string | null
  ): Promise<PublicProfile | null> {
    return cache.wrap(KEY.profile(username, viewerUserId), TTL.profile, () =>
      this.inner.getByUsername(username, viewerUserId)
    )
  }

  async getActivity(username: string, year: number): Promise<ActivityCell[]> {
    return cache.wrap(KEY.activity(username, year), TTL.activity, () =>
      this.inner.getActivity(username, year)
    )
  }

  async getAchievements(username: string): Promise<EarnedAchievement[]> {
    return cache.wrap(KEY.achievements(username), TTL.achievements, () =>
      this.inner.getAchievements(username)
    )
  }
}

export class CachedCommentRepository implements CommentRepository {
  constructor(private readonly inner: CommentRepository) {}

  async listOnProfile(username: string, cursor: string | null): Promise<ProfileCommentsPage> {
    return cache.wrap(KEY.comments(username, cursor), TTL.comments, () =>
      this.inner.listOnProfile(username, cursor)
    )
  }

  post: CommentRepository['post'] = (...args) => this.inner.post(...args)
  delete: CommentRepository['delete'] = (...args) => this.inner.delete(...args)
  like: CommentRepository['like'] = (...args) => this.inner.like(...args)
}

export class CachedSearchRepository implements SearchRepository {
  constructor(private readonly inner: SearchRepository) {}

  async global(query: string, options: GlobalSearchOptions): Promise<GlobalSearchResults> {
    return cache.wrap(KEY.search(query, options), TTL.search, () =>
      this.inner.global(query, options)
    )
  }
}

export const cacheKeys = KEY

function stable(query: CoursesQuery): string {
  const record = query as Record<string, unknown>
  return Object.keys(record)
    .sort()
    .map(key => `${key}=${formatPart(record[key])}`)
    .join('&')
}

function formatPart(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}
