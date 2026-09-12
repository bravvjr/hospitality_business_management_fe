<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Orientation for AI agents (and humans) working in this repository. Read this first,
then follow the links into Notion for the authoritative product and architecture docs.

## What this project is

The **Hospitality Business Management Platform** frontend — a separate Next.js 16 app that
consumes the FastAPI backend at `/api/v1`. It provides a public marketing surface, auth
pages, and an authenticated app shell for inventory, POS, expenses, dashboard, staff, and
(future) reports.

**Mission:** ship a practical UI against the backend MVP, then expand incrementally with
Phase 2+ features (recipes, reports UI, online store).

## Source of truth: Notion

Product scope, architecture, roadmap, and **accepted** Architecture Decision Records live
in Notion. **Always read the relevant pages before implementing or changing anything:**

- **Project Hub** — high-level product context: https://app.notion.com/p/3cd89b75501c81708b90c53049b516a9
- **Product Requirements & Functional Scope**: https://app.notion.com/p/3cd89b75501c81b3b92dca8d3253eedb
- **Architecture — Initial Direction**: https://app.notion.com/p/3cd89b75501c817e9abbeaf2da79277b
- **Development Roadmap & Agent Tasks** (phase checklists — **source of truth for progress**):
  https://app.notion.com/p/3cd89b75501c8114ad41cc437a8c1be2
- **Frontend — Implementation Notes** (locked FE architecture — read before any UI work):
  https://app.notion.com/p/3d789b75501c813eba9ee69f8986f34c
- **Architecture Decision Records (ADRs)**: https://app.notion.com/p/3cd89b75501c814fa389e77472d40d03

## Repository scope

This is the **frontend** repository (Next.js). The backend (FastAPI) lives in a **separate**
repository (ADR-002 repository strategy).

- Frontend repo: `https://github.com/bravvjr/hospitality_business_management_fe`
- Backend repo: `https://github.com/bravvjr/hospitality_business_management`

## Current focus (frontend)

**Phase 1 frontend is complete** for the sell-as-stocked MVP: marketing landing, auth,
app shell, POS (+ receipt), inventory, dashboard, expenses, staff, reports, recipes,
theme toggle.

**Deferred from Phase 1 UI:** full permission/entitlement-gated nav until
`/api/v1/auth/me` exposes grants, staging/production deploy.

**Next (Phase 2):** ingredient costing, kitchen order workflow (KDS).

Update the Notion roadmap when a checklist item is done — do not duplicate the full
checklist here.

## Tech stack

- Next.js 16.3.3 · TypeScript · App Router
- shadcn/ui · Tailwind CSS · next-themes (light/dark required)
- Redux Toolkit — genuine client/application state only (auth session, POS cart flow)
- TanStack Query — server/API state (fetching, caching, mutations)
- React Hook Form + Zod — forms and client-side validation
- OpenAPI codegen — preferred for API contracts; manual feature API wrappers used in Phase 1

See **Frontend — Implementation Notes** and **ADR-013** for locked decisions (no RTK Query,
no tokens in localStorage, no raw `fetch()` in presentational components).

## Git workflow (required)

**Never push directly to `main`.** All changes go through a pull request.

1. `git fetch origin main` — ensure you have the latest `main`.
2. `git checkout -b cursor/<descriptive-name>-eceb` — branch from current `main`.
3. Implement, test (`npm run lint`, `npm run build`).
4. `git push -u origin cursor/<descriptive-name>-eceb`
5. Open a PR to `main` (draft unless the user requests otherwise).

Before starting work, inspect **commit history** (`git log origin/main --oneline`) and any
open/recently merged PRs so you do not redo completed work or misdiagnose what is already
wired (e.g. POS, dashboard, expenses landed via PRs #1–#3).

## Before making changes (mandatory)

1. **Notion** — Read the Project Hub, roadmap checklist, and Frontend Implementation Notes.
   Confirm the task is in scope for the current phase and not already marked done.
2. **Git history** — `git fetch origin main && git log origin/main --oneline -20` and scan
   `src/features/` for existing screens/API wrappers. Do not assume a module is unwired
   without checking the repo.
3. **Backend contract** — API paths use the `/api/v1/...` prefix in feature `api.ts` files;
   `lib/api/client.ts` only prepends `NEXT_PUBLIC_API_URL`. Do not change this unless an
   ADR or explicit user request says otherwise.

## After making changes (mandatory)

1. **Notion** — Update checklist status and add implementation notes on the roadmap or
   Frontend Implementation Notes page when you complete, defer, or materially change scope.
2. **Tests** — Run `npm run lint` and `npm run build` at minimum; add Vitest/Playwright
   coverage when touching critical flows (auth, POS, permissions).
3. **PR** — Push the feature branch and open/update the PR; do not merge unless the user
   explicitly asks.

## Canonical terminology & key decisions

Honor backend ADRs and Frontend Implementation Notes:

- **tenant** — SaaS account / business boundary; UI operates in explicit tenant context after login.
- **subproducts / modules** — platform capabilities (inventory, pos, finance, …), gated by entitlements.
- **Products** — sellable items / menu items (not platform modules).
- **Money** — integer minor units + ISO-4217 currency; use `lib/money.ts`, never floats.
- **Auth** — HttpOnly cookie session from backend; hydrate via `GET /api/v1/auth/me`; backend
  authorization is authoritative; UI permission hints are not a security boundary.
- **State** — TanStack Query for server data; Redux for shared client state only; do not mirror
  API responses in Redux just to cache them.
- **API paths** — full `/api/v1/...` paths in feature API modules (not auto-prefixed in the client).

## Running & testing

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev                  # http://localhost:3000
npm run lint
npm run build
```

Backend must be running for auth and module screens (default `http://localhost:8000`).

## Working agreement for agents

From the roadmap "Agent Rules" and Frontend Implementation Notes:

1. Read Notion and confirm the task belongs to the current roadmap phase.
2. Check git history and existing `src/features/` code before proposing or implementing work.
3. Make the smallest coherent implementation; avoid building future-phase features early.
4. Keep business logic inside the appropriate feature boundary; reuse shadcn/ui primitives.
5. Do **not** silently change architectural decisions — document new ADRs in Notion first.
6. Keep light and dark themes working; add loading, empty, and error states on data screens.
7. Never push to `main` — always use a `cursor/<name>-eceb` branch and open a PR.
8. Update Notion task status and notes after completing or deferring work.

## Definition of Done

A feature is not done merely because the UI renders. It should have: a working implementation,
appropriate validation, tests where applicable, correct handling of auth/session boundaries,
error handling, no known critical regression, deployment compatibility (CI lint + build green),
and Notion updated for non-obvious decisions or scope changes.
