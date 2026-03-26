# Dam's belleza

Production-ready e-commerce platform for a single-vendor beauty store in Yaounde.

## Features

- Bilingual storefront (`fr`, `en`) with locale routing.
- Product catalog for wigs and perfumes with stock visibility.
- Guest checkout with order creation and payment capture.
- Admin operations modules:
	- Orders management
	- Payments review and status updates
	- Delivery assignment and tracking
	- Notifications center
	- Reporting dashboard and exports
	- Dynamic RBAC role management
- Secure document routes for invoice and receipt PDFs.
- PostgreSQL + Prisma with audit-oriented schema and advanced SQL migration.
- Realistic seed pipeline for demo catalog and operational records.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Prisma + PostgreSQL
- NextAuth
- next-intl
- Tailwind CSS

## Quick Start

1. Install dependencies.

```bash
npm install
```

2. Create environment file.

```bash
cp .env.example .env
```

3. Set a valid `DATABASE_URL` and `NEXTAUTH_SECRET` in `.env`.

4. Apply migrations.

```bash
npm run prisma:migrate -- --name init_local
```

5. Seed demo data.

```bash
npm run prisma:seed
```

6. Start development server.

```bash
npm run dev
```

## Useful Commands

- Dev server: `npm run dev`
- Type check: `npm run typecheck`
- Build: `npm run build`
- Production verification: `npm run verify:prod`
- Prisma generate: `npm run prisma:generate`
- Prisma migrate: `npm run prisma:migrate`
- Prisma seed: `npm run prisma:seed`

## Health Check

- Runtime health endpoint: `/api/health`
- Returns:
	- `200` when app and DB are reachable
	- `503` when DB is unreachable

## Demo Accounts

The seed creates staff and customer accounts. Password value for seeded users is defined in `prisma/seed.ts` via `SEED_PASSWORD`.

## Deployment Notes

- Run `npm run verify:prod` before deployment.
- Ensure all required environment variables are configured in the target host.
- Run Prisma migrations in the target environment before first startup.
- See `DEPLOYMENT_CHECKLIST.md` for full release runbook.
