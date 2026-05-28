# Кодиум

An educational platform for learning programming through hands-on practice, not passive consumption. Built with a modern dark aesthetic, interactive 3D visuals, and a gamification system to keep learners engaged.

---

## Table of Contents

- [Project Vision](#project-vision)
- [Planned Features](#planned-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Design System](#design-system)
- [Styling Conventions](#styling-conventions)
- [Component Conventions](#component-conventions)
- [Dev Commands](#dev-commands)

---

## Project Vision

Кодиум is built on a simple observation: you cannot learn to code by watching videos. Real skill comes from writing real code, getting feedback on it, and repeating until patterns click.

**Core philosophy:**

- **Learning by doing** — every concept is paired with an interactive coding task
- **Gamification** — XP, levels, streaks, and achievements turn practice into a loop that feels rewarding
- **Structured paths** — courses with clear hierarchies guide learners from zero to deployable projects
- **Transparency** — public profiles and leaderboards make progress visible and social

**Visual identity:** deep black background, warm off-white text, an animated 3D planet as a hero element, GSAP scroll-driven storytelling on the landing page, frosted-glass cards, and a custom magnetic cursor.

---

## Planned Features

### Online Code Editor with Execution

An in-browser coding environment that supports real code execution:

- Monaco or CodeMirror editor with syntax highlighting, autocomplete, and multi-language support
- Sandboxed server-side execution (isolated containers or Judge0-style service) — no user code runs in the browser
- Real-time output panel displaying stdout, stderr, and runtime errors
- Per-task test suites: user code runs against predefined assertions; pass/fail results shown inline
- Editor state persisted per user per task — resume exactly where you left off

### Courses

A structured catalog of programming content:

- Categories: JavaScript, Python, Algorithms, Web Development, and more
- Each course has: title, description, difficulty level, estimated duration, author, and tags
- **Content hierarchy:** Course → Modules → Lessons → Tasks / Quizzes
- **Lesson types:** text/theory, embedded video, interactive coding task, multiple-choice quiz
- Per-lesson and per-course completion percentage tracked in real time
- Enrollment system with optional prerequisites between courses

### Gamification System

Mechanics that make continued practice feel rewarding:

- **XP (experience points)** — awarded for completing lessons, passing tasks, first-time completions, and daily streaks
- **Level system** — total XP determines current level; visual level badge displayed on profile and leaderboards
- **Daily and weekly challenges** — bonus XP tasks that refresh on a schedule to create return habits
- **Streak tracking** — consecutive days of activity tracked with a flame icon on the profile
- **Leaderboards** — global ranking and per-course ranking, sortable by XP or tasks completed

### Achievements

An unlock system that rewards diverse types of progress:

| Category      | Example Achievement | Condition                             |
| ------------- | ------------------- | ------------------------------------- |
| Progression   | First Steps         | Complete your first lesson            |
| Streak        | On Fire             | Maintain a 7-day streak               |
| Speed         | Speed Coder         | Solve a task under the time limit     |
| Completionist | All Clear           | Finish every task in a course         |
| Hidden        | ???                 | Secret condition — revealed on unlock |

- Each achievement has a name, icon, description, category, and earned date
- Locked achievements show a teaser description without revealing the full condition (for hidden ones)
- Achievement grid displayed prominently on the public profile page

### User Profile

A public page summarising a learner's journey:

- Avatar, display name, bio, and join date
- Stats panel: total XP, current level, active streak, courses enrolled / completed, tasks solved
- Achievement showcase grid with earned dates
- Recent activity feed: lessons completed, achievements unlocked, courses started
- Editable settings: avatar upload, display name, bio, social links (GitHub, LinkedIn, etc.)

### Admin Panel

A protected back-office for platform management. **Live** — lives under the
`(admin)` route group, gated by [`AdminLayout`](src/app/%28admin%29/layout.tsx) at
the page level with **`requireBackofficePageRole`** on each route. tRPC uses
`adminProcedure`, **`moderatorProcedure`**, and **`authorStaffProcedure`** (see
[`src/server/api/procedures.ts`](src/server/api/procedures.ts)); **`AUTHOR` =
teacher** owns courses via `Course.authorId`. Mutations that pass through audit
middleware still write **`AuditLog`**.

- **Dashboard** — counts of users, courses, tasks, content pages, achievements, comments
- **Users** — **Admin:** full list with search/role/ban filters; per-user tabs (Профиль, Роль и бан, Достижения, Активность, Комментарии); role / XP / plan / achievements / activity delete. **Moderator:** slim list (admins hidden); user detail with chat mute/unmute and global comments only — no email/plan/XP surfaces; cannot act on `ADMIN` targets
- **Каталог: курсы и категории** — **Admin:** full. **Author:** own courses only in list; create/delete/status; **no** global `reorderCourses`. Categories remain admin-only for tree editing
- **Course editor** (flagship UX) — `/admin/courses/[id]` for **admin** or **author** of that course; server checks ownership on every write
- **Контент-страницы** — Markdown CMS for `/p/[slug]`; published rows with `placement = FOOTER` automatically render as link columns in `PlatformFooter`. Includes side-by-side markdown preview
- **Достижения** — caталог CRUD: title / description / category / rarity / goal / hidden / coverImage
- **Дейлики и спидраны** — **admin + moderator:** date-keyed `DailyChallenge` (3 tasks/day) and ISO-week-keyed `WeeklyChallenge` (5 tasks/week)
- **Лидерборд** — sortable list with per-user toggle "Исключить из рейтинга" → `User.excludedFromLeaderboard`
- **Комментарии** — **admin + moderator:** global moderation table; one-click delete on any thread (profile, course, etc.)
- **Сообщения с сайта** — **admin + moderator:** contact form inbox (`ContactMessage`)
- **Тарифы** — CRUD for `Plan` (tier level, XP bonus %, optional active-enrollment cap); users get default free plan in seed
- **ИИ: разбор кода** — `/admin/ai-code-improve` edits `AppSetting('ai_code_improve')` JSON (OpenAI-compatible `model`); воркер **`code-improve-worker`** (Go, см. `workers/code-improve`) читает очередь `ai.code_improve.requested`
- **Языки** — **admin + author:** read/update `AppSetting('allowed_languages')`. Used by `CourseTask.allowedLanguages` per-task overrides
- **Живой чат** — toggle «гости могут писать» (`AppSetting('livechat_guest_policy')`); модерация чата на вкладке пользователя «Роль и бан»
- **Аудит** — append-only `AuditLog` viewer with filters by actor / target

Staff entry: header `UserMenu` shows **«Панель управления»** when
`User.role ∈ { ADMIN, MODERATOR, AUTHOR }`. Public course page shows **«Редактировать курс»**
when `course.canManageBySlug` is true. Wrong-role deep links redirect inside `(admin)`.
Banned users (any non-admin with `bannedUntil > now()`) are redirected to a
public `/banned` page by `protectedProcedure` and the platform middleware.

Schema additions for the panel live in [`prisma/schema.prisma`](prisma/schema.prisma):
`User.bannedUntil/banReason/excludedFromLeaderboard`, `Course.order`,
`CourseCategory.order/iconKey`, `CourseTask.allowedLanguages`, plus new
models `ContentPage`, `AuditLog`, `AppSetting`. Bootstrap an admin via
`ADMIN_BOOTSTRAP_EMAIL` env: the matching email gets `role = ADMIN` on first
WorkOS sync (and on `npm run db:seed`).

---

## Tech Stack

| Layer           | Library / Tool                           | Role                                                                                                            |
| --------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Framework       | **Next.js 15** + **React 19**            | App Router, RSC by default, `reactCompiler: true`, `output: 'standalone'`                                       |
| Language        | **TypeScript** (strict)                  | `noUncheckedIndexedAccess`, Bundler module resolution                                                           |
| API             | **tRPC v11** + **TanStack Query v5**     | End-to-end type-safe API, server prefetch + `HydrateClient`                                                     |
| Database        | **Prisma 6** + PostgreSQL 16             | Schema-first ORM, `prisma migrate` workflow, full domain in `prisma/schema.prisma`                              |
| Cache / locks   | **Redis 7** (`ioredis`)                  | Read-through cache, fixed-window rate limits, distributed lock helper                                           |
| Broker          | **RabbitMQ 3** (`amqplib`)               | Topic exchange + DLX for execution.requested / execution.completed events                                       |
| Worker          | **Go 1.23 + Docker SDK**                 | `workers/code-executor` runs Python / PHP user code in ephemeral sandboxes                                      |
| Auth            | **WorkOS AuthKit**                       | OAuth / SSO; mirrored to local `User` rows by `UserSyncService` (Postgres `findUnique`, uncached for freshness) |
| UI Library      | **Mantine 8** + `@mantine/notifications` | Forms, modals, notifications, spotlight, mega-menu hover cards, tabs, progress                                  |
| Code Editor     | **`@monaco-editor/react`** (lazy)        | In-browser Monaco editor for the in-course experience                                                           |
| 3D              | **Three.js 0.176** + **R3F** + **drei**  | Interactive planet scene on the landing page                                                                    |
| Animation       | **GSAP 3.13**                            | Scroll-triggered animations (`ScrollTrigger` plugin)                                                            |
| State           | **Zustand 4**                            | Lightweight client state: cursor position, planet scale/visibility                                              |
| Styling         | **Sass** (CSS modules)                   | `.module.scss` per component + global SCSS; no Tailwind                                                         |
| Icons           | **Font Awesome 6**                       | SVG icon components                                                                                             |
| Rich Text       | **Tiptap 2**                             | Admin lesson authoring (link extension + starter kit)                                                           |
| Validation      | **Zod**                                  | Runtime schema validation for tRPC inputs and environment                                                       |
| Sanitization    | **`sanitize-html`**                      | Server-side scrub of every persisted markdown / comment / bio                                                   |
| Cron            | **`node-cron`**                          | Daily activity snapshot job                                                                                     |
| Env             | **T3 Env** (`@t3-oss/env-nextjs`)        | Type-safe environment variable access                                                                           |
| Package Manager | **npm 10**                               | `package-lock.json` committed                                                                                   |

---

## Architecture

### Request flow

```
Browser Request
  └─► Next.js App Router
        ├─ Server Components (async)
        │     └─► tRPC server caller  ──►  Prisma Client  ──►  PostgreSQL
        │             └─ prefetch + HydrateClient (dehydrated cache)
        └─ Client Components ('use client')
              └─► tRPC React hooks (TanStack Query)
                    └─► /api/trpc  ──►  tRPC handler  ──►  Prisma  ──►  PostgreSQL
```

### Route groups

| Group                   | Status | Description                                                                                                                                                                    |
| ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `(home)`                | Live   | Public marketing / landing page — no auth required                                                                                                                             |
| `(authentication)`      | Live   | Custom Mantine auth UI (`/login`, `/signup`, magic link, password reset) + WorkOS User Management APIs; hosted PKCE entry `GET /auth/workos/start`; `/callback` finishes OAuth |
| `(platform)/(standard)` | Live   | Platform shell: courses list/detail, public profile, settings, coming-soon stubs                                                                                               |
| `(platform)/(focus)`    | Live   | Full-viewport in-course experience: 3-pane code editor + tasks + execution                                                                                                     |
| `(admin)`               | Live   | Admin panel — role-gated layout + `adminProcedure` + audit log                                                                                                                 |

### Data flow rules

- Pages are `async` server components. They call `api.*` from `~/trpc/server` to prefetch data before HTML is sent.
- Interactive client subtrees are wrapped in `HydrateClient` so they receive the pre-fetched cache without a loading state.
- All mutations use tRPC React hooks (TanStack Query `useMutation`). Optimistic updates via `onMutate` where appropriate.
- Auth state is read server-side via WorkOS session; the middleware file guards protected route groups.

### Repository pattern (server-side)

Every tRPC router delegates to an interface in `src/server/repositories/` rather than calling
Prisma directly. Concrete implementations live next to each interface:

- `<Domain>FakeRepository` — returns predefined fixtures from `fixtures.ts`. Used when
  `USE_FAKE_DATA=true` for offline UI development.
- `<Domain>PrismaRepository` — production Prisma queries. Wrapped in a thin
  `Cached<Domain>Repository` decorator (Redis read-through) for the read-heavy domains
  (course, lesson, profile, comment, search).
- `getAppRepositories()` (in `src/server/repositories/index.ts`) returns the right bundle
  based on `USE_FAKE_DATA`. The bundle is injected into `ctx.repositories` inside
  `createTRPCContext`. Routers stay thin and never import Prisma directly.

### Caching, rate limit, idempotency

- `src/server/redis.ts` — single `ioredis` connection.
- `src/server/cache.ts` — `wrap(key, ttl, loader)`, `del`, prefix-scoped invalidation.
- `src/server/rateLimit.ts` — Redis Lua fixed-window limiter shared by every middleware.
- `src/server/api/middlewares.ts` + `src/server/api/procedures.ts` —
  `idempotentProcedure`, `heavyProcedure`, `commentProcedure`, `searchProcedure`.

| Procedure       | Limit           |
| --------------- | --------------- |
| `execution.run` | 10 / min / user |
| `comment.post`  | 5 / min / user  |
| `search.global` | 30 / min / IP   |

Idempotent mutations (`enrollment.start/abandon`, `comment.post`, `execution.run`,
`settings.update`) accept an `idempotency-key` HTTP header; the first response is
persisted in `IdempotencyKey` and replayed for 24h on duplicates.

### Outbox + RabbitMQ

`execution.run` writes the `Execution` row + the matching `OutboxEvent` in a single
`prisma.$transaction`. The `outbox` service polls `OutboxEvent` with
`SELECT … FOR UPDATE SKIP LOCKED`, publishes via a `CircuitBreaker`-protected channel,
and exponentially backs off on failures. The Go `worker-code-exec` consumes
`execution.requested`, runs the code, and emits `execution.completed`. The
`result-consumer` updates the DB row, advances the `Enrollment`, logs a `UserActivity`,
and busts cache keys.

### Daily activity snapshot

`src/server/jobs/activitySnapshot.ts` runs as a separate compose service. At
`ACTIVITY_SNAPSHOT_CRON` (default `30 0 * * *` UTC) it aggregates the previous day's
`UserActivity` rows into `UserActivitySnapshot` so the heatmap query stays a single
cheap range scan.

### Hardening

- Security headers via `next.config.js`: HSTS, CSP (script-src `self` + WorkOS), X-Frame,
  Permissions-Policy, Referrer-Policy.
- `sanitize-html` runs on every persisted markdown / comment / bio.
- Zod `.max()` constraints on every user-supplied input.
- Prisma parameterises all queries; `$queryRaw` is only used inside tagged templates.
- WorkOS sets HttpOnly + SameSite=Lax cookies; tRPC fetches are CSRF-safe by origin.

### Auth gating

AuthKit middleware (`src/middleware.ts`) runs on almost every route via a broad matcher (excluding Next internals and `/assets`). Routes listed in `middlewareAuth.unauthenticatedPaths` stay reachable without signing in (`/courses`, `/u/[username]`, `/login`, `/login/*`, `/signup`, `/signup/*`, `/auth/*`, `/callback`, `/api/*`, etc.). Authenticated-only routes (`/settings/*`, `/learn/*`, `/account/*`, …) redirect guests to login. **WorkOS dashboard Sign-in endpoint / initiate-login URI** should target **`/auth/workos/start`** (sets PKCE verifier), not `/login`. OAuth connections themselves are configured in WorkOS; tiles on `/login` come from `GET /api/auth/providers` and honor `NEXT_PUBLIC_AUTH_OAUTH_*` flags. Admin UI routes rely on `(admin)` layout plus `adminProcedure` server-side (role check). Mutations that require identity use `protectedProcedure` in `src/server/api/trpc.ts`, which throws `UNAUTHORIZED` when `ctx.user` is null.

---

## Directory Structure

```
coderoster/
├── .cursor/                          # Cursor IDE config (rules, skills)
│   ├── rules/
│   └── skills/
└── frontend/                         # Next.js application root
    ├── prisma/
    │   └── schema.prisma             # Prisma DB schema
    ├── public/
    │   └── assets/textures/planet/   # 4K planet texture maps (diffuse, bump, clouds, etc.)
    ├── next.config.js
    ├── postcss.config.cjs            # Mantine breakpoint variables
    ├── tsconfig.json
    └── src/
        ├── env.js                    # T3 Env — validated environment variables
        ├── middleware.ts             # WorkOS auth middleware (route protection)
        ├── app/                      # Next.js App Router
        │   ├── layout.tsx            # Root layout: providers, global style imports, Notifications
        │   ├── (home)/               # Landing page route group
        │   │   ├── page.tsx          # Server component — prefetches tRPC data
        │   │   └── styles.module.scss
        │   ├── (authentication)/     # Custom login/signup UI + WorkOS session
        │   │   ├── login/page.tsx      # Email step + OAuth tiles → `/auth/workos/start`
        │   │   ├── login/password/, login/code/, forgot-password/, reset-password/
        │   │   ├── signup/, signup/password/, signup/code/
        │   │   └── callback/route.ts   # AuthKit `handleAuth`
        │   ├── auth/workos/start/route.ts   # PKCE bootstrap → hosted AuthKit
        │   ├── (platform)/           # Authenticated / public-read platform pages
        │   │   ├── (standard)/       # Header + padded main + footer
        │   │   │   ├── layout.tsx
        │   │   │   ├── courses/      # /courses, /courses/[slug]
        │   │   │   ├── u/[username]/ # public profile page
        │   │   │   ├── settings/     # account settings (auth-gated)
        │   │   │   └── coming-soon/  # placeholder for upcoming pages
        │   │   └── (focus)/          # Full-viewport editor experience (no footer)
        │   │       ├── layout.tsx
        │   │       └── learn/[courseSlug]/[lessonId]/page.tsx
        │   └── api/trpc/[trpc]/      # tRPC HTTP handler
        ├── features/                 # Feature-scoped components and hooks
        │   ├── platform/             # Authenticated platform features
        │   │   ├── courses-list/     # CoursesList, CourseCard, CourseFilters, CoursesGrid
        │   │   ├── course-detail/    # CourseHeader, CourseOutcomes, CourseSyllabus,
        │   │   │                     #   CourseEnrollPanel
        │   │   ├── in-course/        # 3-pane shell: TaskNav, TaskPane, LessonMarkdown,
        │   │   │                     #   CodeEditor, ExecutionPanel, useDraftPersistence
        │   │   ├── profile/          # ProfileHeader, StatCards, ActivityHeatmap,
        │   │   │                     #   AchievementsGrid, CoursesShowcase, ProfileComments
        │   │   └── settings/         # SettingsTabs + Profile/Account/Socials/Appearance forms
        │   └── home/
        │       ├── components/
        │       │   ├── 3d/           # Three.js / R3F scenes and models
        │       │   │   ├── models/Planet/
        │       │   │   └── scenes/planet/
        │       │   │       ├── CameraSetup/
        │       │   │       ├── ClientPlanetSceneLoader/  # dynamic import (ssr: false)
        │       │   │       ├── PlanetScene/
        │       │   │       └── ScalablePlanet/
        │       │   ├── common/       # Shared within the home feature
        │       │   │   ├── Cursor/   # Custom magnetic cursor
        │       │   │   ├── header/   # Header, HeaderAuth, HeaderLogo, HeaderAuthButton
        │       │   │   └── nav/      # NavMenu, NavMenuItem
        │       │   ├── layouts/      # Structural wrapper components
        │       │   │   └── DescriptionWithAnimation/
        │       │   └── ui/           # Leaf interactive components
        │       │       ├── DescriptionWithAnimationList/
        │       │       ├── DescriptionWithAngryAnimation/
        │       │       ├── DescriptionWithRainAnimation/
        │       │       └── InteractiveButton/
        │       └── hooks/            # useCursor* interaction hooks
        │           ├── useCursorArrowToTarget.tsx
        │           ├── useCursorFillTarget.tsx
        │           ├── useCursorInteraction.tsx
        │           └── useCursorOutlineTarget.tsx
        ├── shared/                   # Cross-feature code
        │   ├── assets/
        │   │   ├── fonts/            # YandexSans TTF font files
        │   │   └── styles/
        │   │       ├── variables.scss   # CSS custom properties (design tokens, incl. platform-* vars)
        │   │       ├── mixins.scss      # Reusable SCSS mixins
        │   │       ├── globals.scss     # Global element styles, [data-platform-shell] cursor reset
        │   │       ├── fonts.scss       # @font-face declarations
        │   │       └── normalize.scss   # CSS reset (normalize v8)
        │   └── components/
        │       ├── common/           # Logo
        │       ├── layouts/          # PlatformShell (header, footer, body cursor reset)
        │       └── ui/               # PureButton, SearchSpotlight, KeyboardBadge,
        │                             #   PlatformSearchSpotlight (tRPC-backed)
        ├── server/
        │   ├── db.ts                 # Prisma client singleton
        │   ├── api/
        │   │   ├── root.ts           # tRPC app router (merges all sub-routers)
        │   │   ├── trpc.ts           # tRPC context (db, headers, repositories, user) +
        │   │   │                     #   `publicProcedure` and `protectedProcedure`
        │   │   └── routers/          # course, lesson, enrollment, progress, execution,
        │   │                         #   profile, settings, comment, search, post (legacy)
        │   └── repositories/         # Domain interfaces + Fake/Prisma implementations
        │       ├── types.ts
        │       ├── fixtures.ts
        │       ├── stub.ts
        │       ├── *.repository.ts   # one file per domain
        │       └── index.ts          # `getAppRepositories()` factory
        └── trpc/
            ├── react.tsx             # TRPCReactProvider + typed hooks
            ├── server.ts             # Server-side caller + HydrateClient
            └── query-client.ts       # TanStack Query client config
```

---

## Design System

All design tokens are CSS custom properties defined in `src/shared/assets/styles/variables.scss`. They are available globally and must be used instead of hardcoded values everywhere.

### Colors

| Token                      | Value                         | Usage                      |
| -------------------------- | ----------------------------- | -------------------------- |
| `--color-bg`               | `black`                       | Page background            |
| `--color-text`             | `#F2E7E7`                     | Primary text               |
| `--color-text-secondary`   | 60% opacity of `--color-text` | Body copy, descriptions    |
| `--color-text-semivisible` | 20% opacity of `--color-text` | Dividers, ghost elements   |
| `--color-bg-el`            | 3% text over transparent      | Card / element surface     |
| `--color-bg-el-border`     | 10% text                      | Card borders               |
| `--color-bg-semivisible`   | 25% black                     | Frosted glass overlay      |
| `--color-primary`          | 25% `#1B1EC8` blue            | Glow effects, accents      |
| `--color-positive`         | `#31d154`                     | Success states             |
| `--color-negative`         | `#C31D1D`                     | Error / destructive states |

### Typography

| Token                     | Value  |
| ------------------------- | ------ |
| `--font-size-h1`          | `48px` |
| `--font-size-h2`          | `32px` |
| `--font-size-h3`          | `20px` |
| `--font-size-h4`          | `18px` |
| `--font-size-h5`          | `15px` |
| `--font-size-h6`          | `12px` |
| `--font-size-default`     | `14px` |
| `--letter-spacing-title`  | `4px`  |
| `--letter-spacing-button` | `2px`  |

**Fonts:**

- `YandexSansDisplay` — used for headings and body text; weights 100, 300, 400, 400-italic, 700
- `YandexSansText` — used for prose and UI labels; weights 100, 300, 400, 400-italic, 500, 700

Both font families are loaded via `@font-face` in `fonts.scss` from local TTF files in `src/shared/assets/fonts/`.

### Sizes

| Token                           | Value                           | Usage                       |
| ------------------------------- | ------------------------------- | --------------------------- |
| `--width-content`               | `min(100% - padding*2, 1536px)` | Max-width content container |
| `--padding-main`                | `1.5rem`                        | Horizontal page padding     |
| `--header-height`               | `76px`                          | Fixed header height         |
| `--border-radius-el`            | `1.5em`                         | Cards and panels            |
| `--border-radius-button`        | `0.25em`                        | Buttons                     |
| `--border-radius-input`         | `0.15em`                        | Inputs                      |
| `--border-radius-input-rounded` | `0.75em`                        | Pill-style inputs           |

### Effects and Transitions

| Token                   | Value        |
| ----------------------- | ------------ |
| `--blur-effect-default` | `blur(15px)` |
| `--transition-default`  | `300ms`      |
| `--transition-button`   | `300ms`      |
| `--transition-long`     | `400ms`      |

### SCSS Mixins

Defined in `src/shared/assets/styles/mixins.scss`. Import in every module file.

| Mixin                 | What it does                                                                      |
| --------------------- | --------------------------------------------------------------------------------- |
| `buttonReset()`       | `flex`, `align-items: center`, `gap`, transitions, removes border and outline     |
| `inputReset()`        | Transparent background and border, styled placeholder                             |
| `bluredBg()`          | `backdrop-filter: var(--blur-effect-default)` + semi-transparent black background |
| `mainShadow()`        | Large diffuse blue glow (`box-shadow` using `--color-primary`)                    |
| `fontYandexDisplay()` | Sets `font-family` to `YandexSansDisplay`                                         |
| `fontYandexSans()`    | Sets `font-family` to `YandexSansText`                                            |

### Global style load order

Imported in `src/app/layout.tsx` in this order:

```
@mantine/core/styles.layer.css   ← Mantine base (CSS layer)
normalize.scss                    ← CSS reset
fonts.scss                        ← @font-face declarations
variables.scss                    ← CSS custom properties
globals.scss                      ← Global element rules (body, h1-h6, p, a, ul, img)
```

---

## Styling Conventions

1. **One module per component.** Every component folder contains `index.tsx` and `styles.module.scss`.

2. **Always import mixins first.** Every `.module.scss` file starts with:

   ```scss
   @import '~/shared/assets/styles/mixins.scss';
   ```

3. **Never hardcode design values.** Colors, font sizes, border radii, transitions, and spacing all come from CSS custom properties:

   ```scss
   // correct
   color: var(--color-text);
   font-size: var(--font-size-h3);

   // wrong
   color: #f2e7e7;
   font-size: 20px;
   ```

4. **Class naming — camelCase BEM.** Module class keys use camelCase; BEM separators are `__` for elements and `--` for modifiers:

   ```scss
   .navMenu {
   }
   .navMenu__item {
   }
   .navMenu__item--active {
   }
   ```

5. **No Tailwind.** All styles live in SCSS modules or `globals.scss`. Do not introduce utility-class libraries.

6. **Global rules only in `globals.scss`.** Element-level defaults (`body`, `h1-h6`, `a`, `ul`, etc.) live there. Component-specific styles stay in their module.

---

## Component Conventions

### File structure

```
ComponentName/
├── index.tsx           # Default export + Props interface
└── styles.module.scss  # Scoped styles (optional for pure wrappers)
```

For stateful components, a Zustand store is colocated:

```
ComponentName/
├── index.tsx
├── styles.module.scss
└── component.store.ts  # or scope.store.ts
```

### Code rules

- **Props interface is always named `Props` and exported.** Extend other interfaces when needed (`export interface Props extends PureButtonProps`).
- **Default export only** — named exports only for the `Props` interface and any colocated types.
- **`'use client'` directive** goes on the first line of any component that uses browser APIs, React hooks with side effects, GSAP, Three.js, or Zustand.
- **Server components** (pages, layouts) are `async` functions that call `api.*` from `~/trpc/server`.
- **Path alias `~/`** resolves to `src/`. Never use relative imports that climb more than one directory.

### Interactive cursor

Components that want cursor interaction effects attach one of the dedicated hooks:

| Hook                          | Effect                                                             |
| ----------------------------- | ------------------------------------------------------------------ |
| `useCursorFillTarget(ref)`    | Cursor fills and merges into the element on hover                  |
| `useCursorOutlineTarget(ref)` | Cursor expands as an outline ring around the element               |
| `useCursorArrowToTarget(ref)` | Cursor transforms into a directional arrow pointing at the element |

These hooks live in `~/features/home/hooks/` and communicate cursor state via the Zustand store in `~/features/home/components/common/Cursor/cursor.store.ts`.

### 3D scene loading

Three.js / R3F components are always loaded via `dynamic` import with `ssr: false`:

```tsx
// ClientPlanetSceneLoader pattern
const PlanetScene = dynamic(() => import('../PlanetScene'), { ssr: false })
```

This prevents SSR errors from browser-only WebGL APIs.

---

## Dev Commands

Run from the `frontend/` directory.

| Command                 | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `npm run dev`           | Start dev server with Turbopack                          |
| `npm run build`         | Production build                                         |
| `npm run start`         | Start production server                                  |
| `npm run preview`       | Build then start (production preview)                    |
| `npm run check`         | ESLint + TypeScript typecheck                            |
| `npm run typecheck`     | TypeScript typecheck only                                |
| `npm run lint`          | ESLint only                                              |
| `npm run lint:fix`      | ESLint with auto-fix                                     |
| `npm run format:write`  | Prettier — format all files                              |
| `npm run format:check`  | Prettier — check without writing                         |
| `npm run db:generate`   | `prisma migrate dev` — generate and apply migration      |
| `npm run db:push`       | `prisma db push` — push schema without migration file    |
| `npm run db:migrate`    | `prisma migrate deploy` — apply migrations in production |
| `npm run db:studio`     | Open Prisma Studio in the browser                        |
| `npm run test`          | Vitest — unit + integration (Fake repos, no real stack)  |
| `npm run test:watch`    | Vitest watch mode                                        |
| `npm run test:coverage` | Vitest with v8 coverage report                           |

### Testing

The repository ships a tri-tier test suite:

| Tier            | Runner                        | Scope                                                                                          |
| --------------- | ----------------------------- | ---------------------------------------------------------------------------------------------- |
| **Unit**        | Vitest                        | Pure functions, services, Fake repositories — no DB/Redis/Rabbit                               |
| **Integration** | Vitest + tRPC `createCaller`  | Full router stack against Fake repositories seeded with [@faker-js/faker](https://fakerjs.dev) |
| **Load**        | k6 in its own compose service | Real stack via HTTP, see [`tests/load/`](../tests/load)                                        |
| **Workers**     | `go test`                     | Sandbox runner helpers, AMQP wire, OpenAI client                                               |

Run from the repository root once the stack is up:

```bash
# Unit + integration (in-memory, fast)
docker compose exec app npm run test

# Coverage report
docker compose exec app npm run test:coverage

# Load scenarios (one at a time)
docker compose run --rm tests-load run /tests/load/catalog_browse.js
docker compose run --rm tests-load run /tests/load/course_detail.js
docker compose run --rm tests-load run /tests/load/execution_run.js
docker compose run --rm tests-load run /tests/load/search_global.js
docker compose run --rm tests-load run /tests/load/profile_read.js
docker compose run --rm tests-load run /tests/load/livechat_read.js

# Go workers (unit tests — separate golang image; runtime containers have no `go` binary)
docker compose run --rm tests-go-code-executor test ./...
docker compose run --rm tests-go-code-improve test ./...
```

**Faker seed convention.** [`app/tests/setup/vitest.setup.ts`](tests/setup/vitest.setup.ts)
calls `faker.seed(42)` before every test file so randomised inputs stay
deterministic across CI runs. Each factory in
[`app/tests/setup/fixtures/`](tests/setup/fixtures) accepts a partial override
so individual cases can pin only the field they care about.

**FakeRepository coverage.** The faker gap noted by previous reviewers (admin
sub-domains + livechat shipped Prisma-only) is closed in
[`app/tests/setup/repositories/fakeAdmin.ts`](tests/setup/repositories/fakeAdmin.ts).
Tests instantiate the relevant Fake directly and pass it to
`buildTestCaller({ adminOverrides: { ... } })` when an admin router is under
test.

### Environment setup

Copy the repo-root `.env.example` to `.env` and fill in:

- `DATABASE_URL` (auto-derived from `POSTGRES_*` if unset)
- `REDIS_URL`, `RABBITMQ_URL`
- WorkOS credentials (client ID, API key, redirect URI)
- `USE_FAKE_DATA=true` (recommended during frontend-only development) switches every
  server repository to its in-memory fixture implementation. See
  [`src/server/repositories/`](src/server/repositories) and
  [`ROUTES.md`](ROUTES.md) for the full surface.

For end-to-end development run `docker compose up --build` from the repository root —
that brings up Postgres, Redis, RabbitMQ, the Next.js app, the outbox dispatcher,
the result consumer, the activity snapshot service and the Go code-executor worker.

---

## Platform pages

The `(platform)` route group ships five user-facing pages, each backed by tRPC procedures
documented in [`ROUTES.md`](ROUTES.md):

| Page                             | Auth      | Notes                                                                                                      |
| -------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| `/courses`                       | public    | Hero + filter rail (search, language, difficulty, sort) + responsive `CourseCard` grid                     |
| `/courses/[slug]`                | public    | Article-style header, "Чему научишься", collapsible syllabus, sticky enroll panel with state machine       |
| `/learn/[courseSlug]/[lessonId]` | protected | 3-pane focus shell: lesson nav with progress bar, markdown task pane, Monaco editor, execution panel       |
| `/u/[username]`                  | public    | Profile header with XP/level, GitHub-style activity heatmap, achievements grid, courses showcase, comments |
| `/settings`                      | protected | Mantine vertical tabs: Profile, Account, Socials, Appearance — all bound to `settings.update`              |

### Shared platform shell

[`src/shared/components/layouts/PlatformShell`](src/shared/components/layouts/PlatformShell)
hosts the chrome shared by every platform page:

- **PlatformHeader** — fixed top bar with Logo, Laravel-style mega-menu (`Learn`, `Practice`,
  `Community`, `Docs`) using Mantine `HoverCard`, `SearchTrigger` opening
  `PlatformSearchSpotlight`, and a `UserMenu` (Mantine `Menu` + WorkOS session).
- **PlatformFooter** — slim variant of the home footer: link columns + newsletter form,
  background wordmark, no contact form, no GSAP entrance.
- **PlatformBodyAttribute** — sets `body[data-platform-shell="true"]` so `globals.scss` can
  override the home page's `cursor: none` rules with native cursors.
- **PlatformSearchSpotlight** — Mantine `Spotlight` bound to the tRPC `search.global` query;
  shortcut keys `mod+K`, `mod+P`, `/`.

### In-course experience

[`src/features/platform/in-course`](src/features/platform/in-course) implements the
Yandex-Praktikum-style learning loop:

- `InCourseShell` orchestrates the 3-pane layout and owns execution state.
- `TaskNav` renders the lesson list with status icons and a progress bar.
- `TaskPane` + `LessonMarkdown` render the lesson body.
- `CodeEditor` is a thin wrapper around `@monaco-editor/react`, dynamic-imported with
  `ssr: false`. Languages: `python`, `php`.
- `ExecutionPanel` shows tabbed Output / Tests / Errors using `execution.run`.
- `useDraftPersistence` mirrors the editor draft into `localStorage` (instant restore) and
  `progress.saveDraft` (server-side persistence) on every keystroke (debounced).
