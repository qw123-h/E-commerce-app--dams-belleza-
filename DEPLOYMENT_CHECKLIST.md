# Deployment Checklist

This checklist is the Phase 14 final polish and release runbook for Dam's belleza.

## 1) Environment and Secrets

- Set production `DATABASE_URL`.
- Set `NEXTAUTH_URL` to the public HTTPS origin.
- Set `NEXTAUTH_SECRET` to a strong random value.
- Set Cloudinary vars if image upload is used:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- Confirm `WHATSAPP_NUMBER` and `STORE_NAME`.

Render note:

- If deploying on Render, set these vars in the service settings or use `render.yaml`.
- Ensure `NEXTAUTH_URL` exactly matches your public Render URL.

## 2) Database Readiness

- Verify PostgreSQL is reachable from app host.
- Apply migrations:

```bash
npm run prisma:migrate -- --name deploy
```

- Seed only in non-production/demo contexts:

```bash
npm run prisma:seed
```

## 3) Build Verification
  - For production image uploads these vars are required.

Run locally or in CI before release:

```bash
npm ci
npm run verify:prod
```

Expected: typecheck and build both pass with no errors.

## 4) Runtime Smoke Checks

After deployment, verify:

- `GET /api/health/live` returns `200` and `status: alive`.
- `GET /api/health/ready` returns `200` and `status: ok`.
- `GET /api/health/business` returns `200` and business flow status `ok`.
- `GET /api/health` returns detailed checks for app, DB, and env.
- Storefront pages load:
  - `/fr`
  - `/fr/products`
  - `/en/products`
- Admin auth flow:
  - `/fr/auth/sign-in`
  - protected admin routes redirect correctly when unauthenticated.

## 5) Business Flow Validation

- Create a guest order from checkout.
- Confirm admin can:
  - view order
  - update order status
  - review payment
  - assign delivery
- Confirm invoice and receipt document routes are accessible with valid auth/token.
- Confirm reports dashboard loads and export endpoints respond.

## 6) Security and Access Control

- Validate middleware protects admin pages and privileged APIs.
- Validate role/permission updates affect access immediately after session refresh.
- Ensure no secrets are committed to source control.

## 7) Monitoring and Recovery

- Capture startup logs and error logs.
- Configure Render health check path to `/api/health/ready`.
- Track `/api/health/live` for process uptime and `/api/health/ready` for dependency readiness.
- Track `/api/health/business` for checkout-to-delivery operational readiness.
- Keep database backup/restore procedure documented for the hosting environment.

## 9) Production Upload Validation

- Confirm Cloudinary env vars are set in Render:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- Validate one product image upload from admin module after deploy.

## 10) No-Shell Recovery Path (Render)

- If Render Shell is not available:
  - Set `RUN_SEED_ON_BOOT=true`.
  - Set `SEED_PASSWORD` to a strong temporary value.
  - Redeploy once (startup runs migrations and seed).
  - Validate admin login and health probes.
  - Set `RUN_SEED_ON_BOOT=false` and redeploy again.

## 8) Release Decision

Approve release only if all checkpoints above pass.
