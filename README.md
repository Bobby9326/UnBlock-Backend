# UnBlock — Backend

Backend for **UnBlock**, a blog management system. Built with Node.js + Express in **TypeScript**, **Supabase** (Postgres + Storage) via Prisma, JWT auth, Multer uploads, Zod validation, and an auto-generated **Swagger / OpenAPI** spec.

---

## Tech stack

| Concern        | Choice                          |
| -------------- | ------------------------------- |
| Language       | TypeScript (ESM, NodeNext)      |
| Runtime        | Node.js — `tsx` (dev), `tsc`→`node` (prod) |
| Web framework  | Express 4                       |
| Database       | Supabase Postgres               |
| ORM            | Prisma                          |
| Auth           | JWT (`jsonwebtoken`)            |
| Passwords      | bcrypt                          |
| Validation     | Zod                             |
| API docs       | OpenAPI 3 (zod-to-openapi) + Swagger UI |
| File upload    | Multer (memory) → Supabase Storage |
| Scheduled jobs | node-cron                       |

---

## Architecture

Feature-based modules. Each module is split into four layers with a strict
dependency direction:

```
routes  →  controller  →  service  →  repository  →  Prisma
```

- **routes** — declare endpoints + attach middleware (validation, auth, ownership).
- **controller** — read the request, call a service, send the response. No logic.
- **service** — all business rules live here.
- **repository** — the only layer that talks to Prisma.

Every module file is TypeScript (`*.ts`). Imports keep the `.js` extension
(NodeNext resolution) so the same specifiers work compiled or via `tsx`.

```
src/
├── config/          env.ts, database.ts, supabase.ts, multer.ts
├── modules/
│   ├── auth/        register, login, logout, me
│   ├── users/       self profile edit + change password
│   ├── blogs/       CRUD + search/sort/pagination + like_count/is_liked_by_me
│   ├── comments/    comment + reply (1 level), nested-tree response
│   ├── likes/       toggle like/unlike
│   ├── notifications/
│   ├── uploads/
│   └── admin/       user management + blog management (super admin only)
├── middlewares/     auth, active-check, role-check, ownership, upload, error, validate
├── jobs/            cleanup-orphan-files cron
├── utils/           jwt, hash, pagination, response, AppError, asyncHandler
├── types/           AuthUser + Express Request augmentation
├── docs/            OpenAPI registry + per-module path definitions → Swagger UI
├── routes/index.ts  mounts every module under /api
├── app.ts           express app factory
└── server.ts        boot + graceful shutdown
```

Each module is split into `*.routes.ts`, `*.controller.ts`, `*.service.ts`,
`*.repository.ts` and `*.validation.ts`.

---

## Setup

### 1. Prerequisites

- Node.js 20+ (needs `tsx` and the built-in test runner)
- A [Supabase](https://supabase.com) project (free tier is fine). From it you need:
  - **Database** → Connection string (pooled + direct) → `DATABASE_URL` / `DIRECT_URL`
  - **Project Settings → API** → project URL + **service_role** key → `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
  - **Storage** → create a bucket (e.g. `uploads`), set it **Public** → `SUPABASE_BUCKET`

### 2. Install

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — set the Supabase database, storage and JWT values:

| Variable                    | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `PORT`                      | HTTP port (default 4000)                                       |
| `DATABASE_URL`              | Supabase **pooled** connection (Transaction pooler, port 6543) |
| `DIRECT_URL`                | Supabase **direct** connection (port 5432) — used by migrations |
| `JWT_SECRET`                | Secret for signing tokens (use a long random string)           |
| `JWT_EXPIRES_IN`            | Token lifetime (default `7d`)                                  |
| `SUPABASE_URL`              | Supabase project URL (`https://<ref>.supabase.co`)             |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (backend only — **never** expose to frontend) |
| `SUPABASE_BUCKET`           | Storage bucket name (default `uploads`)                        |
| `MAX_UPLOAD_BYTES`          | Max upload size in bytes (default 5 MB)                        |
| `CLEANUP_CRON`              | Cron for the orphan-file job (default hourly)                  |
| `ORPHAN_MAX_AGE_HOURS`      | Delete unreferenced uploads older than this                    |
| `SEED_ADMIN_*`              | Initial super-admin credentials for the seed script            |

> **Why two connection strings?** Prisma's `migrate` needs a direct
> (non-pooled) connection, while the running app should use the pgbouncer
> pooler. `schema.prisma` maps `url → DATABASE_URL` and `directUrl → DIRECT_URL`.

### 4. Create the database schema

```bash
npm run prisma:generate     # generate the Prisma client
npm run prisma:migrate       # create + apply the first migration
```

> `prisma:migrate` runs `prisma migrate dev`, which creates
> `prisma/migrations/` and applies it. In production use `npm run prisma:deploy`.
> A ready-made initial migration already ships in `prisma/migrations/` — if you
> only want to apply it (not create a new one), run `npm run prisma:deploy`.

### 5. Seed the initial super admin

```bash
npm run seed
```

Creates one `super_admin` account (status `active`) from the `SEED_ADMIN_*`
env vars. Log in, then change the password.

### 6. Run

```bash
npm run dev              # dev: tsx watch (no build step, reloads on change)
# or, for production:
npm run build            # compile TypeScript → dist/
npm start                # run the compiled dist/server.js
```

Type-check without emitting: `npm run typecheck`.

API base: `http://localhost:4000/api` — health check at `GET /api/health`.

---

## Auth & authorization flow

1. **Register** → account is created with `status = pending`.
2. A **super admin activates** the account (`PATCH /api/admin/users/:id/activate`).
3. **Login** issues a JWT **two ways at once**:
   - Set as an **httpOnly cookie** (`unblock_token`) — browser frontends send it
     automatically on every request; JavaScript can't read it (XSS-safe).
   - Also returned in the JSON body — non-browser clients (Swagger / curl /
     mobile) send it as `Authorization: Bearer <token>`.

   The auth middleware reads the **cookie first**, then falls back to the
   Bearer header, so both client types work against the same endpoints.
4. **Logout** (`POST /api/auth/logout`) clears the cookie. The JWT stays valid
   until expiry (stateless design — no server-side revocation).
5. A non-active user is blocked from every endpoint **except `/api/auth/*`**.
6. Two roles only: `super_admin`, `general_user`. Super admins can do everything
   a general user can, plus user management and deleting any blog.

**Browser frontends:** set `CORS_ORIGINS` in `.env` to your frontend origin(s)
and make requests with credentials (`fetch(url, { credentials: 'include' })` or
`axios` with `withCredentials: true`) so the cookie is sent. Credentialed CORS
cannot use a wildcard origin — the origin must be whitelisted.

**Middleware order** on protected routes:
`auth (verify JWT)` → `active-check` → `role-check` / `ownership-check`.

---

## Interactive API docs (Swagger)

Once the server is running:

| URL                          | What it is                                   |
| ---------------------------- | -------------------------------------------- |
| `GET /api/docs`              | Swagger UI — browse & try every endpoint     |
| `GET /api/docs.json`         | Raw OpenAPI 3.0 spec (for Postman / codegen) |

The spec is generated at boot from the same Zod schemas used for request
validation (`@asteasolutions/zod-to-openapi`), so request bodies, query params
and path params in the docs always match what the API actually validates — they
can't drift. Response shapes and entity models live in `src/docs/`.

To authorize in Swagger UI: call `POST /api/auth/login`, copy the `token`, click
**Authorize** (top right), and paste it — all protected routes then send the
Bearer header.

---

## API reference

All routes are prefixed with `/api`. Responses use a consistent envelope:

```jsonc
// success
{ "success": true, "data": { ... }, "meta": { ... } }   // meta only on lists
// error
{ "success": false, "error": { "code": "...", "message": "...", "details": [ ... ] } }
```

### Authentication

| Method | Path             | Access | Notes                                |
| ------ | ---------------- | ------ | ------------------------------------ |
| POST   | `/auth/register` | Guest  | Creates a `pending` user             |
| POST   | `/auth/login`    | Guest  | Returns `{ token, user }`            |
| POST   | `/auth/logout`   | User   | Stateless — client discards token    |
| GET    | `/auth/me`       | User   | Current user profile                 |

### Profile (self)

| Method | Path                | Access       | Notes                                    |
| ------ | ------------------- | ------------ | ---------------------------------------- |
| PUT    | `/profile`          | Active user  | Edit `username` / `avatarUrl`            |
| PATCH  | `/profile/password` | Active user  | Requires `currentPassword` + `newPassword` |

### Blogs

| Method | Path         | Access      | Notes                                              |
| ------ | ------------ | ----------- | -------------------------------------------------- |
| GET    | `/blogs`     | Active user | `?search=&tag=&sort=newest\|oldest\|most_liked\|title&page=&limit=` — includes `likeCount` + `isLikedByMe`. `?author=me` lists your own blogs incl. **drafts** (add `?status=draft\|published` for "My Posts" tabs). Public browsing is always published-only. |
| GET    | `/blogs/:id` | Active user | Detail                                             |
| POST   | `/blogs`     | Active user | Create (`content` is ProseMirror/Tiptap JSON)      |
| PUT    | `/blogs/:id` | Owner       | Update                                             |
| DELETE | `/blogs/:id` | Owner / Super admin | Delete                                     |

### Comments (reply nested 1 level)

| Method | Path                   | Access      | Notes                                          |
| ------ | ---------------------- | ----------- | ---------------------------------------------- |
| GET    | `/blogs/:id/comments`  | Active user | Nested tree: root comments with `replies[]`    |
| POST   | `/blogs/:id/comments`  | Active user | Body: `content`, optional `parentId`. `parentId` must be a **root** comment — replying to a reply is rejected. |

### Like

| Method | Path              | Access      | Notes                                       |
| ------ | ----------------- | ----------- | ------------------------------------------- |
| POST   | `/blogs/:id/like` | Active user | Toggle. Returns `{ liked, count }`          |

### Upload

| Method | Path            | Access      | Notes                                              |
| ------ | --------------- | ----------- | -------------------------------------------------- |
| POST   | `/uploads`      | Active user | multipart field `file` (jpg/png/webp, ≤5 MB). Returns `{ id, path, url }` |
| POST   | `/uploads/sign` | Active user | Body `{ paths: string[] }` (≤100) → `{ urls: { <path>: <signedUrl\|null> } }` |

**The bucket is private.** Uploads use a **path + signed-URL** model so images
never break when a URL expires:

- `POST /uploads` returns `path` (the canonical storage key) and `url` (a
  **short-lived signed URL for immediate preview only**).
- **Persist the `path`** — in `blog.content` image `src`, `coverImageUrl`, and
  `avatarUrl`. Never store the signed `url`.
- Before displaying images, batch-resolve paths via `POST /uploads/sign` and use
  the returned signed URLs in `<img src>`. They expire (default 1h,
  `SIGNED_URL_TTL_SECONDS`) — re-resolve on page load.

**Frontend image workflow (important):**

1. Upload → get `{ path, url }`. Show `url` in the editor immediately; keep
   `path` as the value you save.
2. In the Tiptap document, image node `src` must hold the **path** (not a signed
   URL). Resolve to signed URLs only for rendering — e.g. a custom image node
   that stores `path` in attrs and swaps in a signed URL for display, or a render
   pass that rewrites `src` via `/uploads/sign`.
3. On save, the document/cover/avatar must contain **paths**. If a signed URL
   leaks into saved content it will 400 once it expires.

### Tags

| Method | Path    | Access      | Notes                                                        |
| ------ | ------- | ----------- | ------------------------------------------------------------ |
| GET    | `/tags` | Active user | List tags with `blogCount`, popularity-ordered. `?search=` for autocomplete, `?limit=` (default 50). |

Tags are **free-text**: you pass a `tags: string[]` when creating/updating a blog
and any new name is created on the fly. Names are **normalized** (trimmed,
lowercased, whitespace-collapsed) so `React`, `react`, and ` REACT ` all map to
one tag. Use `GET /tags` to power a "choose existing or type new" input, and the
`?tag=` filter on `GET /blogs` (also normalized).

### Notifications

| Method | Path                       | Access | Notes                                                        |
| ------ | -------------------------- | ------ | ------------------------------------------------------------ |
| GET    | `/notifications`           | User   | Load list (real `is_read` state). **Call this before read-all.** |
| PATCH  | `/notifications/read-all`  | User   | Marks all as read. Called automatically right after GET.     |
| DELETE | `/notifications`           | User   | "Clear All" — soft delete (`is_cleared=true`, never removed) |

> **Ordering matters:** the frontend calls `GET` first so the user sees which
> items were new, then immediately calls `PATCH /read-all`. They are separate
> calls by design — never combined.

Each notification includes a **`blog`** object (`{ id, title, coverImageUrl }`)
or **`null`**. It's null for `system` / `user_registered` types, or when the
referenced blog was deleted — a single missing blog never breaks the list.
`coverImageUrl` is a **storage path**; sign it via `POST /uploads/sign` before
display. `referenceId` holds the `blogId` for comment/reply/like, and the new
user's id for `user_registered`.

**Registration alerts:** when a user registers (status `pending`), every super
admin gets a `user_registered` notification so they know to approve the account.
Notification type enum: `comment | reply | like | system | user_registered`.

### Admin — user management (super admin only)

| Method | Path                             | Notes                                    |
| ------ | -------------------------------- | ---------------------------------------- |
| GET    | `/admin/users`                   | `?search=&status=&role=&sort=&page=&limit=` |
| PATCH  | `/admin/users/:id/activate`      | Set status `active`                      |
| PATCH  | `/admin/users/:id/disable`       | Set status `disabled`                    |
| PATCH  | `/admin/users/:id`               | Edit another user's fields               |
| POST   | `/admin/users/:id/reset-password`| Reset password (no current password needed) |
| DELETE | `/admin/users/:id`               | Delete a user                            |

### Admin — blog management (super admin only)

| Method | Path           | Notes                            |
| ------ | -------------- | -------------------------------- |
| GET    | `/admin/blogs` | List every author's blogs        |

---

## Business rules

1. **Blog `content` is JSON** (Prisma `Json` / Postgres `jsonb`), storing the
   ProseMirror/Tiptap document so inline images keep their authored order.
2. **Notifications: GET before PATCH read-all** — two separate calls, so the
   user sees the "new" state before it's marked read.
3. **Comment replies are 1 level only** — replying to a reply is rejected
   (`parentId` must reference a root comment).
4. **Likes can't duplicate** — enforced by a DB `UNIQUE(blog_id, user_id)`
   constraint, not just an application check.
5. **Orphan-file cleanup** — files live in a **private Supabase Storage bucket**;
   the DB tracks each object's `path`. A cron job deletes uploads with
   `is_referenced = false` older than `ORPHAN_MAX_AGE_HOURS` from both the bucket
   and the DB. A blog/avatar references an upload when its cover, avatar, or
   inline-image **paths** match; those uploads are flagged on create/update.
   Viewing is via short-lived **signed URLs** (`POST /uploads/sign`), never
   public URLs.
6. **Reset vs change password** — admin reset (`/admin/users/:id/reset-password`)
   never checks the old password; self change (`/profile/password`) always does.
   Separate endpoints, separate validation.

---

## Testing

```bash
npm test
```

Runs the Node built-in test runner against pure-logic units (ProseMirror image
extraction, pagination, CORS origin matching) — no database required.

---

## Deployment (frontend on Vercel, backend on Render)

The frontend (Vercel) and backend (Render) live on **different domains**, so the
auth cookie is cross-site. The code already handles this: in production the
cookie is set `SameSite=None; Secure`, and CORS runs in credentialed mode with a
per-origin allow-list (see `src/utils/cors.ts`).

### Backend on Render

A `render.yaml` blueprint is included. Create the service via **Render → New →
Blueprint**, or configure a Web Service manually with:

| Setting            | Value                                      |
| ------------------ | ------------------------------------------ |
| Build command      | `npm install --include=dev && npm run build` |
| Pre-deploy command | `npm run prisma:deploy`                     |
| Start command      | `npm start`                                 |
| Health check path  | `/api/health`                               |

Notes:
- `--include=dev` is required because `typescript` is a devDependency and Render
  sets `NODE_ENV=production` (which would otherwise skip it).
- `postinstall` runs `prisma generate` automatically.
- `prisma` and `tsx` are runtime dependencies so `prisma migrate deploy` and the
  seed script work in production.

Set these env vars in the Render dashboard (the rest have defaults in
`render.yaml`):

| Var                         | Value                                             |
| --------------------------- | ------------------------------------------------- |
| `DATABASE_URL` / `DIRECT_URL` | Supabase pooled / direct connection strings     |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | from Supabase → API              |
| `CORS_ORIGINS`              | your Vercel origins (see below)                   |
| `JWT_SECRET`                | generated by Render, or your own long random string |

Seed the first super admin once from the Render **Shell**: `npm run seed`.

### CORS origins for Vercel

Vercel gives production a stable domain plus a random subdomain per preview
deploy. Cover both with a wildcard:

```
CORS_ORIGINS="https://your-app.vercel.app,https://*.vercel.app"
```

The `*` matches exactly one subdomain label (so `https://*.vercel.app` allows
`unblock-git-main-you.vercel.app` but not `a.b.vercel.app` or a lookalike like
`evil-vercel.app`).

### Frontend on Vercel

- Point the frontend at the Render URL, e.g. `https://unblock-backend.onrender.com/api`.
- **Send credentials on every request** so the cookie flows:
  - `fetch(url, { credentials: 'include' })`, or
  - axios: `axios.defaults.withCredentials = true`.
- Set the API base URL as a Vercel env var (e.g. `VITE_API_URL` /
  `NEXT_PUBLIC_API_URL`).

> **Free-tier caveat:** Render free web services sleep after inactivity, so the
> first request after idle takes ~30–60 s to cold-start. The `node-cron` cleanup
> job also pauses while the service is asleep.

### Keeping the free tiers awake (uptime monitors)

Two health probes are provided for external monitors (UptimeRobot, etc.):

| Endpoint          | Touches DB? | Use it to keep awake |
| ----------------- | ----------- | -------------------- |
| `GET /api/health`    | No       | **Render** (liveness — cheap) |
| `GET /api/health/db` | Yes (`SELECT 1`) | **Render + Supabase** (also returns `latencyMs`) |

`/api/health/db` returns **503** with code `DATABASE_UNAVAILABLE` if the database
is unreachable, so a monitor watching it alerts on real DB outages — not just
whether the web process is up.

Suggested UptimeRobot setup: monitor `/api/health/db` every **5 minutes** (below
Render's ~15-min sleep threshold), optionally with keyword `"status":"ok"`.
A single monitor on `/api/health/db` keeps both Render and Supabase warm.

---

## Scripts

| Script                   | Description                              |
| ------------------------ | ---------------------------------------- |
| `npm run dev`            | Dev server via `tsx watch`               |
| `npm run build`          | Compile TypeScript → `dist/`             |
| `npm start`              | Run the compiled `dist/server.js`        |
| `npm run typecheck`      | `tsc --noEmit` type-check                |
| `npm run prisma:generate`| Generate Prisma client                   |
| `npm run prisma:migrate` | Create + apply a dev migration           |
| `npm run prisma:deploy`  | Apply migrations (production)            |
| `npm run prisma:studio`  | Open Prisma Studio                       |
| `npm run seed`           | Seed the initial super admin             |
| `npm test`               | Run unit tests (`tsx --test`)            |
