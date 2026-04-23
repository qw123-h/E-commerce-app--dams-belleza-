import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CheckResult = {
  name: string;
  ok: boolean;
  details?: string;
};

async function tableExists(tableName: string) {
  const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${tableName}
    ) AS exists
  `;

  return Boolean(result[0]?.exists);
}

async function viewExists(viewName: string) {
  const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.views
      WHERE table_schema = 'public' AND table_name = ${viewName}
    ) AS exists
  `;

  return Boolean(result[0]?.exists);
}

async function functionExists(functionName: string) {
  const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = ${functionName}
    ) AS exists
  `;

  return Boolean(result[0]?.exists);
}

async function triggerExists(triggerName: string) {
  const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.triggers
      WHERE trigger_schema = 'public' AND trigger_name = ${triggerName}
    ) AS exists
  `;

  return Boolean(result[0]?.exists);
}

async function constraintExists(constraintName: string) {
  const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = ${constraintName}
    ) AS exists
  `;

  return Boolean(result[0]?.exists);
}

async function runChecks() {
  const checks: CheckResult[] = [];

  checks.push({ name: "Table AuditLog exists", ok: await tableExists("AuditLog") });

  checks.push({ name: "View sales_summary_view exists", ok: await viewExists("sales_summary_view") });
  checks.push({ name: "View profit_summary_view exists", ok: await viewExists("profit_summary_view") });
  checks.push({ name: "View order_details_view exists", ok: await viewExists("order_details_view") });

  checks.push({ name: "Function calculate_profit_range exists", ok: await functionExists("calculate_profit_range") });
  checks.push({ name: "Function generate_monthly_report exists", ok: await functionExists("generate_monthly_report") });
  checks.push({ name: "Function get_low_stock_alerts exists", ok: await functionExists("get_low_stock_alerts") });
  checks.push({ name: "Function confirm_payment_atomic exists", ok: await functionExists("confirm_payment_atomic") });
  checks.push({ name: "Function place_order_atomic exists", ok: await functionExists("place_order_atomic") });

  checks.push({ name: "Trigger trg_payment_confirm_stock exists", ok: await triggerExists("trg_payment_confirm_stock") });
  checks.push({ name: "Trigger trg_sync_product_low_stock exists", ok: await triggerExists("trg_sync_product_low_stock") });
  checks.push({ name: "Trigger trg_prevent_negative_stock exists", ok: await triggerExists("trg_prevent_negative_stock") });
  checks.push({ name: "Trigger trg_audit_order exists", ok: await triggerExists("trg_audit_order") });
  checks.push({ name: "Trigger trg_audit_payment_status_change exists", ok: await triggerExists("trg_audit_payment_status_change") });

  checks.push({ name: "Constraint Order_total_consistency_chk exists", ok: await constraintExists("Order_total_consistency_chk") });
  checks.push({ name: "Constraint Review_rating_range_chk exists", ok: await constraintExists("Review_rating_range_chk") });

  const lowStockRows = await prisma.$queryRaw<Array<{ product_id: string }>>`
    SELECT product_id
    FROM public.get_low_stock_alerts()
    LIMIT 1
  `;
  checks.push({
    name: "Function get_low_stock_alerts executes",
    ok: Array.isArray(lowStockRows),
    details: `rows_returned=${lowStockRows.length}`,
  });

  const failed = checks.filter((c) => !c.ok);

  for (const check of checks) {
    const marker = check.ok ? "PASS" : "FAIL";
    const suffix = check.details ? ` (${check.details})` : "";
    console.log(`${marker}: ${check.name}${suffix}`);
  }

  if (failed.length > 0) {
    throw new Error(`Phase 1 verification failed with ${failed.length} issue(s).`);
  }

  console.log("Phase 1 verification completed successfully.");
}

runChecks()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
