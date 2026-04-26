# Frontend API Routes

Single source of truth for every outgoing call made by the frontend. Update on every new
fetch / tRPC procedure that hits the network.

> The repository pattern lives in `src/server/repositories/` and is selected at runtime by
> the `USE_FAKE_DATA` env flag. Procedures listed below delegate to that layer and
> therefore work identically against fake fixtures or the real Prisma backend.

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

| Procedure          | Auth   | Input                                                                                                                                                | Output                                                                  | Used in                                                                                                                                                                                                                        |
| ------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `course.list`      | public | `{ q?, language?: 'python' \| 'php', difficulty?: 'beginner'\|'intermediate'\|'advanced', sort?: 'popular'\|'newest'\|'shortest', cursor?, limit? }` | `{ items: CourseSummary[], nextCursor: string \| null, total: number }` | [`features/platform/courses-list/CoursesList`](src/features/platform/courses-list/CoursesList/index.tsx), prefetched in [`app/(platform)/(standard)/courses/page.tsx`](src/app/%28platform%29/%28standard%29/courses/page.tsx) |
| `course.getBySlug` | public | `{ slug: string }`                                                                                                                                   | `CourseDetail \| null`                                                  | [`app/(platform)/(standard)/courses/[slug]/page.tsx`](src/app/%28platform%29/%28standard%29/courses/%5Bslug%5D/page.tsx)                                                                                                       |

### Lessons (`lesson.*`)

| Procedure       | Auth   | Input                              | Output                 | Used in                                                                                                                                              |
| --------------- | ------ | ---------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lesson.getOne` | public | `{ courseSlug, lessonId: string }` | `LessonDetail \| null` | [`app/(platform)/(focus)/learn/[courseSlug]/[lessonId]/page.tsx`](src/app/%28platform%29/%28focus%29/learn/%5BcourseSlug%5D/%5BlessonId%5D/page.tsx) |

`LessonDetail` includes `body` (markdown), `starterCode`, `language`, ordered tests
metadata, `previousLessonId` and `nextLessonId`.

### Enrollment (`enrollment.*`)

| Procedure               | Auth      | Input                    | Output                                                     | Used in                                                                                                                                |
| ----------------------- | --------- | ------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enrollment.getMine`    | public¹   | `{ courseSlug: string }` | `EnrollmentState \| null`                                  | [`features/platform/course-detail/CourseEnrollPanel`](src/features/platform/course-detail/CourseEnrollPanel/index.tsx)                 |
| `enrollment.start`      | protected | `{ courseSlug: string }` | `EnrollmentState`                                          | `CourseEnrollPanel`                                                                                                                    |
| `enrollment.abandon`    | protected | `{ courseSlug: string }` | `EnrollmentState`                                          | `CourseEnrollPanel`                                                                                                                    |
| `enrollment.myShowcase` | protected | _none_                   | `{ active: CourseShowcase[], finished: CourseShowcase[] }` | [`features/platform/profile/CoursesShowcase`](src/features/platform/profile/CoursesShowcase/index.tsx) (only when viewing own profile) |

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

| Procedure       | Auth      | Input                                                                              | Output      | Used in                      |
| --------------- | --------- | ---------------------------------------------------------------------------------- | ----------- | ---------------------------- |
| `execution.run` | protected | `{ taskId: string, language: 'python' \| 'php', code: string (max 50_000 chars) }` | `RunResult` | `InCourseShell` (Run button) |

`RunResult` shape:

```ts
{
  stdout: string
  stderr: string
  runtimeMs: number
  passed: boolean
  testResults: Array<{
    name: string
    passed: boolean
    expected: string | null
    actual: string | null
    message: string | null
  }>
}
```

The real implementation will enqueue jobs to RabbitMQ; until then the procedure is
served by `FakeExecutionRepository` which inspects the snippet locally.

### Profile (`profile.*`)

| Procedure                 | Auth   | Input                        | Output                  | Used in                                                                                                              |
| ------------------------- | ------ | ---------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `profile.getByUsername`   | public | `{ username: string }`       | `PublicProfile \| null` | [`app/(platform)/(standard)/u/[username]/page.tsx`](src/app/%28platform%29/%28standard%29/u/%5Busername%5D/page.tsx) |
| `profile.getActivity`     | public | `{ username, year: number }` | `ActivityCell[]`        | [`features/platform/profile/ActivityHeatmap`](src/features/platform/profile/ActivityHeatmap/index.tsx)               |
| `profile.getAchievements` | public | `{ username: string }`       | `EarnedAchievement[]`   | [`features/platform/profile/AchievementsGrid`](src/features/platform/profile/AchievementsGrid/index.tsx)             |

### Settings (`settings.*`)

| Procedure          | Auth      | Input                                                                                               | Output         | Used in                                                                                                  |
| ------------------ | --------- | --------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| `settings.getMine` | protected | _none_                                                                                              | `UserSettings` | [`app/(platform)/(standard)/settings/page.tsx`](src/app/%28platform%29/%28standard%29/settings/page.tsx) |
| `settings.update`  | protected | partial `UserSettings` (display name, username regex, bio max 400, avatar URL, socials, appearance) | `UserSettings` | All forms under [`features/platform/settings/sections/*`](src/features/platform/settings/sections)       |

### Comments (`comment.*`)

| Procedure               | Auth      | Input                                           | Output                                                         | Used in                                                                                                |
| ----------------------- | --------- | ----------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `comment.listOnProfile` | public    | `{ username: string, cursor?: string \| null }` | `{ items: ProfileCommentEntry[], nextCursor: string \| null }` | [`features/platform/profile/ProfileComments`](src/features/platform/profile/ProfileComments/index.tsx) |
| `comment.post`          | protected | `{ username: string, body: string (1..1000) }`  | `ProfileCommentEntry`                                          | `ProfileComments`                                                                                      |
| `comment.delete`        | protected | `{ commentId: string }`                         | `{ ok: true }`                                                 | _Reserved for the comment owner / admin moderation_                                                    |

### Search (`search.*`)

| Procedure       | Auth   | Input           | Output                                                               | Used in                                                                                                                    |
| --------------- | ------ | --------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `search.global` | public | `{ q: string }` | `{ courses: SearchHit[], users: SearchHit[], lessons: SearchHit[] }` | [`shared/components/ui/search/PlatformSearchSpotlight`](src/shared/components/ui/search/PlatformSearchSpotlight/index.tsx) |

`SearchHit` shape: `{ kind: 'course' \| 'user' \| 'lesson', id, title, subtitle, href }`.

### Demo router (`post.*`)

The original T3 starter `post.hello`, `post.create`, `post.getLatest` procedures still exist
under `src/server/api/routers/post.ts`. They are not used by the platform UI and will be
removed once a real Prisma migration replaces them.

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
