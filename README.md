# Hospitality Business Management — Frontend

Next.js 16 frontend for the Hospitality Business Management Platform. Consumes the FastAPI backend at `/api/v1`.

**Backend repo:** https://github.com/bravvjr/hospitality_business_management

## Stack

- Next.js 16.3.3 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui primitives
- Redux Toolkit (client/application state)
- TanStack Query (server/API state)
- next-themes (light/dark)

## Getting started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000 for the marketing landing page.

Set `NEXT_PUBLIC_API_URL` to your backend (default `http://localhost:8000`).

## Project structure

```text
src/
├── app/           # Route groups: (marketing), (auth), (app)
├── components/    # Shared UI (ui/, layout/, providers)
├── features/      # Feature modules (marketing, auth, pos, …)
└── lib/           # API client, store, utilities
```

See Notion **Frontend — Implementation Notes** and **ADR-013** for architecture decisions.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm start` — run production server
