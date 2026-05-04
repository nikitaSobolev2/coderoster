# Frontend / API Routes

Single source of truth for every outgoing call between the platform UI and the
server. Update on every new fetch / tRPC procedure that hits the network.

> The repository pattern lives in `src/server/repositories/` and is selected at runtime by
> the `USE_FAKE_DATA` env flag. Cached repository decorators (Redis) wrap the read-heavy
> Prisma implementations.

## Cross-cutting concerns

| Concern         | Mechanism                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------- |
| Auth            | WorkOS session via `withAuth()` resolved once in `createTRPCContext`, hydrated to local `User` |
| Rate limiting   | Redis fixed-window Lua script. Limits expressed per-procedure below                            |
| Idempotency     | `idempotency-key` header on idempotent mutations; replays cached response within 24h           |
| Caching         | Read-through Redis cache via `Cached*Repository` decorators                                    |
| Outbox + broker | `execution.run` writes `Execution` + `OutboxEvent` in one TX; dispatcher publishes to RabbitMQ |
| Sandboxing      | Go `code-executor` worker spawns one ephemeral Docker container per execution                  |

---

## REST endpoints

### POST `/api/v1/contact`

Send a contact-us message from the home page footer.

- **Used in**: [`src/features/home/components/sections/FooterSection/ContactForm/index.tsx`](src/features/home/components/sections/FooterSection/ContactForm/index.tsx)
- **Auth**: Public (no auth header)
- **Headers**: `Content-Type: application/json`

#### Request body

```ts
{
  name: string,    // 1..120 chars
  email: string,   // RFC 5322
  message: string  // 1..5000 chars
}
```

#### Responses

- `200 OK` → `{ ok: true }`
- `400 Bad Request` → `{ ok: false, error: string }`
- `429 Too Many Requests` → `{ ok: false, error: string }`
- `5xx` → `{ ok: false, error: string }`

#### Backend implementation status

Not yet implemented. Frontend handles all error states gracefully (shows red feedback line under the form).

---

## tRPC procedures

All procedures live under `/api/trpc` and are typed via the `AppRouter` declared in
[`src/server/api/root.ts`](src/server/api/root.ts). Inputs and outputs are validated with
Zod (inputs) and inferred from the repository return types (outputs).

Auth column legend:

- **public** — guests can call; `ctx.user` may be `null`.
- **protected** — requires a WorkOS session; throws `UNAUTHORIZED` otherwise.

### Course catalog (`course.*`)

| Procedure                | Auth      | Input                                                                                                                                                | Output                                                                  | Used in                                                                                                                                                                                                                        |
| ------------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `course.list`            | public    | `{ q?, language?: 'python' \| 'php', difficulty?: 'beginner'\|'intermediate'\|'advanced', sort?: 'popular'\|'newest'\|'shortest', cursor?, limit? }` | `{ items: CourseSummary[], nextCursor: string \| null, total: number }` | [`features/platform/courses-list/CoursesList`](src/features/platform/courses-list/CoursesList/index.tsx), prefetched in [`app/(platform)/(standard)/courses/page.tsx`](src/app/%28platform%29/%28standard%29/courses/page.tsx) |
| `course.getBySlug`       | public    | `{ slug: string }`                                                                                                                                   | `CourseDetail \| null`                                                  | [`app/(platform)/(standard)/courses/[slug]/page.tsx`](src/app/%28platform%29/%28standard%29/courses/%5Bslug%5D/page.tsx)                                                                                                       |
| `course.canManageBySlug` | protected | `{ slug: string }`                                                                                                                                   | `{ canEdit: boolean, courseId: string \| null }`                        | Course detail page — editor link when user is `ADMIN` or `AUTHOR` of course                                                                                                                                                    |

### Lessons (`lesson.*`)

| Procedure       | Auth   | Input                              | Output                 | Used in                                                                                                                                              |
| --------------- | ------ | ---------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lesson.getOne` | public | `{ courseSlug, lessonId: string }` | `LessonDetail \| null` | [`app/(platform)/(focus)/learn/[courseSlug]/[lessonId]/page.tsx`](src/app/%28platform%29/%28focus%29/learn/%5BcourseSlug%5D/%5BlessonId%5D/page.tsx) |

`LessonDetail` includes `body` (markdown), `starterCode`, `language`, ordered tests
metadata, `previousLessonId` and `nextLessonId`.

### Enrollment (`enrollment.*`)

| Procedure               | Auth                  | Input                    | Output                                                     | Used in                                                                                                                                |
| ----------------------- | --------------------- | ------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enrollment.getMine`    | public¹               | `{ courseSlug: string }` | `EnrollmentState \| null`                                  | [`features/platform/course-detail/CourseEnrollPanel`](src/features/platform/course-detail/CourseEnrollPanel/index.tsx)                 |
| `enrollment.start`      | protected, idempotent | `{ courseSlug: string }` | `EnrollmentState`                                          | `CourseEnrollPanel`                                                                                                                    |
| `enrollment.abandon`    | protected, idempotent | `{ courseSlug: string }` | `EnrollmentState`                                          | `CourseEnrollPanel`                                                                                                                    |
| `enrollment.myShowcase` | protected             | _none_                   | `{ active: CourseShowcase[], finished: CourseShowcase[] }` | [`features/platform/profile/CoursesShowcase`](src/features/platform/profile/CoursesShowcase/index.tsx) (only when viewing own profile) |

¹ Returns `null` if the caller is not authenticated.

`EnrollmentState` shape:

```ts
{
  courseSlug: string
  status: 'active' | 'finished' | 'abandoned'
  startedAt: Date
  finishedAt: Date | null
  progressPercent: number    // 0..100
  completedLessonIds: string[]
  currentLessonId: string | null
}
```

### Progress (`progress.*`)

| Procedure               | Auth      | Input                        | Output                | Used in                                                                                                                    |
| ----------------------- | --------- | ---------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `progress.saveDraft`    | protected | `{ lessonId, code: string }` | `{ ok: true }`        | [`features/platform/in-course/useDraftPersistence.ts`](src/features/platform/in-course/useDraftPersistence.ts) (debounced) |
| `progress.getDraft`     | protected | `{ lessonId: string }`       | `string \| null`      | _Reserved for future "load saved draft on hop"_                                                                            |
| `progress.markComplete` | protected | `{ lessonId: string }`       | `{ completed: true }` | [`features/platform/in-course/InCourseShell`](src/features/platform/in-course/InCourseShell/index.tsx)                     |

### Code execution (`execution.*`)

`execution.run` is **asynchronous**. It writes the `Execution` row + the matching
`OutboxEvent` in a single Prisma transaction, returns the new id, and the Go
worker fills in the result. Clients poll `execution.get` until the status hits
a terminal value (`success`, `failed`, `timeout`, `cancelled`).

| Procedure       | Auth                                            | Input                                                                      | Output                    | Used in                      |
| --------------- | ----------------------------------------------- | -------------------------------------------------------------------------- | ------------------------- | ---------------------------- |
| `execution.run` | protected, idempotent, rate-limited 10/min/user | `{ taskId, language: 'python' \| 'php', code: string (max 50_000 chars) }` | `{ executionId: string }` | `InCourseShell` (Run button) |
| `execution.get` | protected                                       | `{ executionId: string }`                                                  | `ExecutionRecord`         | `InCourseShell` polling      |

Send `idempotency-key: <uuid>` on `execution.run` to deduplicate retries. The
underlying `RunResult` payload still lives inside `ExecutionRecord.testResults`
plus the `stdout` / `stderr` / `runtimeMs` / `passed` fields — no change for
the UI.

### Profile (`profile.*`)

| Procedure                 | Auth   | Input                        | Output                  | Used in                                                                                                              |
| ------------------------- | ------ | ---------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `profile.getByUsername`   | public | `{ username: string }`       | `PublicProfile \| null` | [`app/(platform)/(standard)/u/[username]/page.tsx`](src/app/%28platform%29/%28standard%29/u/%5Busername%5D/page.tsx) |
| `profile.getActivity`     | public | `{ username, year: number }` | `ActivityCell[]`        | [`features/platform/profile/ActivityHeatmap`](src/features/platform/profile/ActivityHeatmap/index.tsx)               |
| `profile.getAchievements` | public | `{ username: string }`       | `EarnedAchievement[]`   | [`features/platform/profile/AchievementsGrid`](src/features/platform/profile/AchievementsGrid/index.tsx)             |

### Settings (`settings.*`)

| Procedure          | Auth                  | Input                                                                                               | Output         | Used in                                                                                                  |
| ------------------ | --------------------- | --------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| `settings.getMine` | protected             | _none_                                                                                              | `UserSettings` | [`app/(platform)/(standard)/settings/page.tsx`](src/app/%28platform%29/%28standard%29/settings/page.tsx) |
| `settings.update`  | protected, idempotent | partial `UserSettings` (display name, username regex, bio max 400, avatar URL, socials, appearance) | `UserSettings` | All forms under [`features/platform/settings/sections/*`](src/features/platform/settings/sections)       |

### Comments (`comment.*`)

| Procedure               | Auth                                           | Input                                           | Output                                                         | Used in                                                                                                |
| ----------------------- | ---------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `comment.listOnProfile` | public                                         | `{ username: string, cursor?: string \| null }` | `{ items: ProfileCommentEntry[], nextCursor: string \| null }` | [`features/platform/profile/ProfileComments`](src/features/platform/profile/ProfileComments/index.tsx) |
| `comment.post`          | protected, idempotent, rate-limited 5/min/user | `{ username, body: string (1..1000) }`          | `ProfileCommentEntry`                                          | `ProfileComments`                                                                                      |
| `comment.delete`        | protected                                      | `{ commentId: string }`                         | `{ ok: true }`                                                 | _Reserved for the comment owner / admin moderation_                                                    |
| `comment.vote`          | protected                                      | `{ commentId, vote: 'like' \| 'dislike' }`      | `{ ok: true }`                                                 | _Reserved — uses `SELECT … FOR UPDATE` on the counters_                                                |

### Search (`search.*`)

| Procedure       | Auth                           | Input           | Output                                                               | Used in                                                                                                                    |
| --------------- | ------------------------------ | --------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `search.global` | public, rate-limited 30/min/IP | `{ q: string }` | `{ courses: SearchHit[], users: SearchHit[], lessons: SearchHit[] }` | [`shared/components/ui/search/PlatformSearchSpotlight`](src/shared/components/ui/search/PlatformSearchSpotlight/index.tsx) |

`SearchHit` shape: `{ kind: 'course' \| 'user' \| 'lesson', id, title, subtitle, href }`.

### Admin (`admin.*`)

Procedures use role-specific builders in
[`src/server/api/procedures.ts`](src/server/api/procedures.ts):

- **`adminProcedure`** — `ADMIN` only (+ audit on mutations).
- **`moderatorProcedure`** — `MODERATOR` or `ADMIN` (+ audit where composed).
- **`authorStaffProcedure`** — `AUTHOR` or `ADMIN` (+ audit where composed).

Namespaces still map to pages under [`src/app/(admin)`](src/app/%28admin%29); each
`page.tsx` calls `requireBackofficePageRole` for defense in depth.

| Namespace                  | Typical gate        | Key procedures                                                                                                                                                               |
| -------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin.users`              | admin / moderator\* | `list`, `get`, `update`, `ban`, …; **`moderationList`**, **`moderationGet`**, **`moderationChatMute`**, **`moderationChatUnmute`**, **`moderationListComments`** (moderator) |
| `admin.catalog.categories` | admin               | `list`, `create`, `update`, `delete`, `reorder`                                                                                                                              |
| `admin.catalog.courses`    | admin / author†     | `list`, `create`, `delete`, `setStatus`, `reorder` (`reorder` admin-only)                                                                                                    |
| `admin.courseEditor`       | author / admin‡     | `get`, `updateCourse`, modules/tasks/autotests                                                                                                                               |
| `admin.contentPages`       | admin               | `list`, `get`, `create`, `update`, `delete`, `setPublished`, `reorder`                                                                                                       |
| `admin.achievements`       | admin               | `list`, `get`, `create`, `update`, `delete`                                                                                                                                  |
| `admin.challenges.daily`   | moderator           | `list`, `upsert`, `delete`                                                                                                                                                   |
| `admin.challenges.weekly`  | moderator           | `list`, `upsert`, `delete`                                                                                                                                                   |
| `admin.leaderboard`        | admin               | `list`, `setExclusion`                                                                                                                                                       |
| `admin.comments`           | moderator           | `list`, `delete`                                                                                                                                                             |
| `admin.languages`          | author / admin      | `list`, `update`                                                                                                                                                             |
| `admin.audit`              | admin               | `list`                                                                                                                                                                       |

\*Full user CRUD remains `adminProcedure`; moderators use `moderation*` only.

†Authors see only own courses in `list`; writes check `Course.authorId`.

‡Each mutating call validates course ownership via `assertCourseWritable`.

Entry: `/admin`. `PlatformHeader.UserMenu` shows **«Панель управления»** when
`role ∈ { ADMIN, MODERATOR, AUTHOR }`. Course page offers **«Редактировать курс»**
when `course.canManageBySlug` returns `canEdit: true`. Banned users hit `/banned`;
both wired through `src/middleware.ts`.

## Broker contracts

Every code execution flows through RabbitMQ on the topic exchange
`coderoster.events`. The Zod source of truth lives in
[`src/shared/contracts/execution.ts`](src/shared/contracts/execution.ts) and is
mirrored by hand in `workers/code-executor/internal/contracts/events.go`.

| Topic                 | Producer            | Consumer                | Payload                                                                                 |
| --------------------- | ------------------- | ----------------------- | --------------------------------------------------------------------------------------- |
| `execution.requested` | `outbox` dispatcher | `worker-code-exec` (Go) | `{ executionId, userId, taskId, language, code }`                                       |
| `execution.completed` | `worker-code-exec`  | `result-consumer`       | `{ executionId, status, stdout, stderr, runtimeMs, passed, testResults, errorMessage }` |

---

## Repository / fake-data layer

The interfaces consumed by every router live in `src/server/repositories/` and are
selected by `getAppRepositories()` based on `env.USE_FAKE_DATA`. When the flag is on, all
procedures listed above resolve against in-memory fixtures (`fixtures.ts`); when it is
off, the Prisma-backed implementations will service them once the schema migrations land.

| Repository                 | Interface symbols                                 |
| -------------------------- | ------------------------------------------------- |
| `course.repository.ts`     | `list`, `getBySlug`                               |
| `lesson.repository.ts`     | `getOne`                                          |
| `enrollment.repository.ts` | `getMine`, `start`, `abandon`, `listShowcase`     |
| `progress.repository.ts`   | `saveDraft`, `getDraft`, `markComplete`           |
| `execution.repository.ts`  | `run`                                             |
| `profile.repository.ts`    | `getByUsername`, `getActivity`, `getAchievements` |
| `settings.repository.ts`   | `getMine`, `update`                               |
| `comment.repository.ts`    | `listOnProfile`, `post`, `delete`                 |
| `search.repository.ts`     | `global`                                          |

When implementing the real backend, add a Prisma method body that mirrors the fake
implementation’s contract; the routers do not need to change.
