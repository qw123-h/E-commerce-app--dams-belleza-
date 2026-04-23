## Plan: Dam's belleza E-commerce Build

Build a production-grade Next.js 14 fullstack e-commerce platform for Dam's belleza using PostgreSQL + Prisma + NextAuth + next-intl, with an advanced academic-grade database layer (normalization, triggers, views, functions, transactions, audit logs, soft deletes). Delivery will follow your exact 14-step order, with a checkpoint after each phase for approval.

**Steps**
1. Phase 0: Project foundation setup (blocks all other phases)
- Initialize Next.js 14 App Router + TypeScript + Tailwind + ESLint + Prettier + absolute imports.
- Install and configure core libs: Prisma, NextAuth, Zod, next-intl, Cloudinary SDK, React Hook Form, toast system, charting, export libs.
- Configure env strategy for local/dev/prod (Render-compatible), image optimization, and baseline app shell with language routing.
- Define base design tokens (rose-gold/cream/charcoal palette, typography, spacing scale, motion primitives) and responsive layout contracts.

2. Phase 1: Advanced database design with Prisma + raw SQL (depends on 1)
- Model full normalized schema in Prisma for required entities with UUID keys, timestamps, createdBy/updatedBy where needed, and deletedAt for soft delete.
- Create RBAC as dynamic DB-driven model: users, roles, permissions, role_permissions, user_roles (no hardcoded roles in code).
- Add all mandatory relations and constraints, including order/payment/delivery lifecycle integrity and review/message/notification linking.
- Add explicit indexes on all FKs and frequently queried business columns.
- Add enum types for statuses (order, payment, delivery, stock movement, notification).
- Create SQL migrations for advanced features not fully represented by Prisma:
- Triggers: stock decrement on paid/confirmed orders, low-stock alert trigger, updated_at maintenance.
- Views: sales summary, profit summary, order details denormalized reporting view.
- Stored procedures/functions: profit by date range, monthly summary, stock alert retrieval.
- Transaction strategy: order placement/payment confirmation atomic workflows.
- Audit trail: centralized audit_logs table + trigger-based change capture policy.
- Validate 3NF/BCNF assumptions and document dependency reasoning per critical table cluster.

3. Phase 2: Auth and dynamic RBAC with NextAuth (depends on 2)
- Implement NextAuth with database sessions and Credentials flow for admin/staff + optional customer auth.
- Add dynamic permission resolver from DB tables and helper guards for API/page access.
- Add support for Super Admin bootstrapping and runtime role creation.
- Ensure soft-deleted users cannot authenticate/act.

4. Phase 3: Route protection middleware (depends on 3)
- Build locale-aware middleware for auth + role/permission checks by route segment.
- Protect admin APIs and pages with granular permission keys.
- Add friendly unauthorized and not-found experiences.

5. Phase 4: Storefront core pages (depends on 4)
- Build homepage with premium visual direction, hero, featured products, categories, CTA blocks.
- Build product listing with filters (category/price/availability) and robust pagination/search.
- Build product details with gallery, stock badge, pricing mode logic:
- Perfume: fixed price + add to cart.
- Wig: negotiable CTA to WhatsApp, no direct cart add.
- Add reviews section with moderation-ready data model hooks.

6. Phase 5: Cart, checkout, and delivery zone pricing (depends on 5)
- Implement cart state persistence (guest + signed-in), cart validation against live stock.
- Build checkout with pickup vs delivery, delivery zone selector, and dynamic shipping fee application.
- Produce final order summary in XAF format and localized FR/EN labels.

7. Phase 6: MoMo payment flow with screenshot upload (depends on 6)
- Add payment method selector for Orange Money and MTN MoMo; bank transfer shown as disabled future option.
- Integrate Cloudinary for payment screenshot uploads with secure metadata mapping to payment records.
- Build admin payment review queue with approve/reject actions and reason capture.

8. Phase 7: Invoice/receipt PDF generation (depends on 7)
- Use React-PDF for invoice generation at order placement and receipt generation at payment confirmation.
- Persist invoice/receipt references and expose secure download endpoints.
- Include bilingual labels, business identity, payment metadata, totals, delivery fee, and status stamps.

9. Phase 8: Admin operations modules (depends on 8)
- Products: CRUD, image uploads, pricing mode, stock edits, cost/sale pricing.
- Orders: lifecycle transitions pending to confirmed to dispatched to delivered with audit entries.
- Payments: screenshot verification workflow tied to order progression.

10. Phase 9: Business dashboard and reporting (depends on 9)
- Build KPI cards and charts for daily/weekly/monthly/custom ranges.
- Add wigs vs perfumes breakdown, top-selling products, stock alerts.
- Implement profit formulas from cost/sale/quantity and overall summary.
- Add PDF/Excel exports and report snapshot persistence.

11. Phase 10: WhatsApp + notifications (depends on 10)
- Floating WhatsApp button globally with configured number.
- Wig negotiate button on product pages and admin quick-chat links for customers.
- Add in-app notifications for order/payment/delivery state changes.

12. Phase 11: Delivery management and rider assignment (depends on 11)
- Manage delivery zones/prices dynamically.
- Rider records and assignment UI/workflow.
- Delivery status tracking integrated into order tracking page.

13. Phase 12: Role & permission manager UI (depends on 12)
- Super Admin-only screens to create roles, assign permissions, map users.
- Guard every admin route/action from DB permissions.
- Add helper role templates but keep full dynamic control.

14. Phase 13: Seeding and realistic demo data (depends on 13)
- Seed 17 perfumes and 20 wigs with realistic categories, costs, prices, stock, and images placeholders.
- Seed users, roles, permissions, helpers, delivery zones, riders, sample orders/payments/reviews.

15. Phase 14: Final polish, bilingual QA, performance hardening (depends on 14)
- Complete FR/EN translation coverage with fallback checks.
- Add graceful loading states, robust empty/error states, and mobile polish.
- Optimize images, caching, bundle splits, and slow-network behavior.
- Final Render deployment guide and production checklist.

16. Delivery cadence control (parallel with all phases)
- After each phase: run verification checklist, summarize outputs, and pause for your explicit approval before continuing.

**Relevant files**
- No application source files exist yet in workspace; all app/database/deployment files will be created from scratch during implementation.
- Existing workspace files are limited to Qodo metadata and are out of implementation scope.

**Verification**
1. Phase-gated validation after each step with lint/typecheck/build and targeted functional tests.
2. Database verification per migration: constraints/indexes/enums/triggers/views/functions existence and behavior checks.
3. RBAC verification matrix for Super Admin, Store Owner, Helper, and Customer across UI and API endpoints.
4. Checkout/payment verification on guest and authenticated paths, including MoMo screenshot upload and manual confirmation flow.
5. Reporting verification by cross-checking SQL function/view outputs against transactional order data.
6. i18n verification for all routes/components in FR and EN with fallback behavior.
7. Performance checks for mobile and slow network, including image optimization and loading UX.
8. Render deploy rehearsal using environment parity and post-deploy smoke tests.

**Decisions**
- Store identity: Dam's belleza.
- WhatsApp number: +237 6 91 94 98 58.
- PDF engine: React-PDF.
- Chart library: Recharts.
- Checkout policy: guest checkout with optional account creation.
- Seed baseline: 2 helpers and 1 custom role.
- Planning scope: full master plan plus deep Phase 1 first.
- Currency format: XAF with display style such as 5 000 XAF.

**Further Considerations**
1. Invoice/receipt legal display name locked to Dam's belleza.
2. Cloudinary account/folder naming and signing policy should be confirmed before Phase 6.
3. Chart library locked to Recharts for dashboard implementation.

## Phase 1 Normalization Evidence (3NF/BCNF)

1. User/Auth cluster (`User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `Session`, `Account`)
- Functional dependencies are centered on surrogate keys (`id`) and business unique keys (`email`, `slug`, `key`).
- Many-to-many mappings are decomposed into junction tables (`UserRole`, `RolePermission`) to eliminate repeating groups and transitive dependencies.

2. Catalog/Inventory cluster (`Category`, `Product`, `ProductImage`, `Stock`, `StockMovement`)
- Product descriptive attributes depend on `Product.id` only.
- Stock facts are separated into `Stock` (current state) and `StockMovement` (event history), avoiding update anomalies.
- Product images are fully decomposed (`ProductImage`) to support 1:N media without violating 1NF.

3. Sales lifecycle cluster (`Order`, `OrderItem`, `Payment`, `Delivery`, `DeliveryZone`)
- Order header (`Order`) stores document-level facts; line details are isolated in `OrderItem`.
- Payment and delivery state are normalized into dedicated entities for independent lifecycle transitions.
- Totals are constrained by check constraints, and item-level pricing remains at `OrderItem` granularity for historical accuracy.

4. Engagement/Audit cluster (`Review`, `Message`, `Notification`, `AuditLog`, `ReportSnapshot`)
- Interaction records each represent a single business event and reference parent entities by FK.
- `AuditLog` captures change history separately from operational tables, preserving normalized operational models while enabling traceability.

5. BCNF assumptions
- Determinants are candidate keys in core entities due to UUID PKs + explicit unique constraints.
- Business derivations (profit/sales summaries) are kept in SQL views/functions, not duplicated columns, reducing anomaly risk.

## Plan: Phase 1 Deep Execution Blueprint

Phase 1 will establish an academically strong, production-ready database foundation that all later modules can rely on, including dynamic RBAC, transactional integrity, auditability, and reporting primitives.

**Steps**
1. Define canonical domain model and normalization map
- Finalize entity boundaries and ownership for users/auth, catalog, inventory, orders, payments, delivery, engagement, reporting, and audit.
- Document candidate keys, functional dependencies, and decomposition notes to demonstrate 3NF/BCNF.

2. Create Prisma schema core entities and relations (depends on 1)
- Add all required tables with UUID PKs and relation constraints.
- Add enums for all statuses.
- Add soft-delete fields and standard auditing timestamps.

3. Add index and constraint strategy (depends on 2)
- Add FK indexes and business query indexes (status/date/product/category/user references).
- Add uniqueness constraints for role/permission slugs and junction-table composites.

4. Author initial migrations and baseline seed skeleton (depends on 3)
- Generate baseline Prisma migration for structural tables.
- Add minimal bootstrap seed for Super Admin and permission primitives.

5. Add advanced SQL migration pack (depends on 4)
- Triggers for stock updates and low-stock flag creation.
- Views for sales/profit/order-details reporting.
- Stored functions for profit/date-range and monthly report aggregation.
- Audit trigger functions and audit_logs writes for core transactional tables.

6. Define transactional service contracts (depends on 5)
- Specify atomic operation boundaries for order create, payment confirm/reject, order status transitions, stock movement writes.
- Define rollback semantics and idempotency safeguards.

7. Build DB validation checklist and evidence artifacts (depends on 6)
- Verify schema objects exist and behave as expected.
- Capture proof points for academic submission: normalization rationale, object list, trigger/function test cases.

8. Phase 1 handoff package (depends on 7)
- Summarize schema decisions, migration notes, and known assumptions.
- Pause for your confirmation before Phase 2.

**Relevant files**
- No implementation files exist yet; Phase 1 will create project and database artifacts from scratch.

**Verification**
1. Migration apply/reset runs cleanly in development.
2. Trigger tests confirm stock and low-stock behaviors.
3. View/function outputs match expected sample calculations.
4. Audit log entries appear for create/update/status-change events.
5. Soft-delete filters are valid for core read patterns.
6. Seed produces required baseline RBAC records without duplicates.

**Decisions**
- Advanced SQL features will live in versioned migrations executed alongside Prisma lifecycle.
- All core transactional operations must be ACID with explicit transaction boundaries.
- Hard deletes are disallowed for products, orders, customers.
