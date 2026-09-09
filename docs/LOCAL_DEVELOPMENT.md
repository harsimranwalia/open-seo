# Local Development

## Prerequisites

- Node.js 20+
- [Corepack](https://nodejs.org/api/corepack.html) (bundled through Node.js 24; install it separately on Node.js 25+)
- A DataForSEO account/API credentials

## Local Development Workflow

```sh
# Activates the exact pnpm version declared in package.json.
corepack enable
pnpm install --frozen-lockfile

# Run once per fresh local DB
pnpm run db:migrate:local
```

Verify that `pnpm --version` reports the version declared by the
`packageManager` field in `package.json`. An older global pnpm may reject
the repository's lockfile as incompatible.

Configure `.env.local`:

1. `cp .env.example .env.local`
2. Add `DATAFORSEO_API_KEY` as a base64-encoded `login:password` value:

   `printf '%s' 'YOUR_LOGIN:YOUR_PASSWORD' | base64`

3. Set `AUTH_MODE=hosted`, `BETTER_AUTH_URL=http://localhost:3001`, a long `BETTER_AUTH_SECRET` (≥32 chars), plus `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` for the Super Admin dashboard.

Run locally:

```sh
# Option 1
pnpm run dev

# Option 2 (Recommended)
# This log file makes it easier for your coding agent to debug.
mkdir .logs
touch .logs/dev-server.log

# This command uses portless, which is great for worktrees. It also pipes logs to that fixed file, which is helpful for agent debugging output.
pnpm dev:agents
```

`pnpm dev:agents` runs through [portless](https://github.com/vercel-labs/portless) at `http://open-seo.localhost:1355` by default.

When using a git worktree, [portless](https://github.com/vercel-labs/portless) prefixes the branch name, for example `http://feature-name.open-seo.localhost:1355`.

## Database Commands

Generate migration:

```sh
pnpm run db:generate
```

Migrate local DB:

```sh
pnpm run db:migrate:local
```

## Postgres backend (optional)

D1 (SQLite) is the default. To run against Postgres locally instead — the opt-in
backend for installs that outgrow D1 — see
[`LOCAL_POSTGRES.md`](./LOCAL_POSTGRES.md).

## Auth

OpenSEO uses Better Auth email/password only (`AUTH_MODE=hosted`).

Required env:

- `BETTER_AUTH_SECRET` (≥32 characters)
- `BETTER_AUTH_URL` (e.g. `http://localhost:3001`)
- `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` for `/super-admin/login`

Sign up at `/sign-up`, sign in at `/sign-in`. Password reset requires optional Loops templates when configured.
