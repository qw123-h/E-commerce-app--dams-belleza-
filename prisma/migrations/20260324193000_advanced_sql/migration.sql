-- Advanced PostgreSQL objects for academic CA requirements.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO "AuditLog"("id", "tableName", "recordId", "action", "newData", "createdAt")
    VALUES (gen_random_uuid(), TG_TABLE_NAME, NEW."id"::text, 'CREATE'::"AuditAction", to_jsonb(NEW), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO "AuditLog"("id", "tableName", "recordId", "action", "oldData", "newData", "createdAt")
    VALUES (gen_random_uuid(), TG_TABLE_NAME, NEW."id"::text, 'UPDATE'::"AuditAction", to_jsonb(OLD), to_jsonb(NEW), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO "AuditLog"("id", "tableName", "recordId", "action", "oldData", "createdAt")
    VALUES (gen_random_uuid(), TG_TABLE_NAME, OLD."id"::text, 'SOFT_DELETE'::"AuditAction", to_jsonb(OLD), NOW());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_product ON "Product";
CREATE TRIGGER trg_audit_product
AFTER INSERT OR UPDATE ON "Product"
FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

DROP TRIGGER IF EXISTS trg_audit_order ON "Order";
CREATE TRIGGER trg_audit_order
AFTER INSERT OR UPDATE ON "Order"
FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

DROP TRIGGER IF EXISTS trg_audit_payment ON "Payment";
CREATE TRIGGER trg_audit_payment
AFTER INSERT OR UPDATE ON "Payment"
FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

CREATE OR REPLACE FUNCTION public.apply_stock_for_confirmed_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."status" = 'CONFIRMED' AND (OLD."status" IS DISTINCT FROM 'CONFIRMED') THEN
    UPDATE "Order"
    SET "status" = 'CONFIRMED', "updatedAt" = NOW()
    WHERE "id" = NEW."orderId" AND "status" = 'PENDING';

    UPDATE "Stock" s
    SET
      "quantityOnHand" = s."quantityOnHand" - oi."quantity",
      "updatedAt" = NOW()
    FROM "OrderItem" oi
    WHERE oi."orderId" = NEW."orderId" AND s."productId" = oi."productId";

    INSERT INTO "StockMovement"(
      "id", "productId", "orderItemId", "movementType", "quantityChange", "reason", "createdAt"
    )
    SELECT
      gen_random_uuid(),
      oi."productId",
      oi."id",
      'SALE'::"StockMovementType",
      -oi."quantity",
      'Auto decrement after payment confirmation',
      NOW()
    FROM "OrderItem" oi
    WHERE oi."orderId" = NEW."orderId";

    UPDATE "Product" p
    SET
      "isLowStock" = CASE
        WHEN s."quantityOnHand" <= s."reorderLevel" THEN TRUE
        ELSE FALSE
      END,
      "updatedAt" = NOW()
    FROM "Stock" s
    WHERE p."id" = s."productId";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_confirm_stock ON "Payment";
CREATE TRIGGER trg_payment_confirm_stock
AFTER UPDATE ON "Payment"
FOR EACH ROW EXECUTE FUNCTION public.apply_stock_for_confirmed_payment();

CREATE OR REPLACE VIEW public.sales_summary_view AS
SELECT
  DATE_TRUNC('day', o."createdAt") AS day,
  SUM(o."totalAmount")::numeric(14,2) AS total_sales,
  COUNT(o."id")::int AS orders_count
FROM "Order" o
WHERE o."deletedAt" IS NULL AND o."status" IN ('CONFIRMED', 'DISPATCHED', 'DELIVERED')
GROUP BY DATE_TRUNC('day', o."createdAt")
ORDER BY day DESC;

CREATE OR REPLACE VIEW public.profit_summary_view AS
SELECT
  p."id" AS product_id,
  p."name" AS product_name,
  p."productType",
  COALESCE(SUM(oi."quantity"), 0)::int AS units_sold,
  COALESCE(SUM((oi."unitPrice" - p."costPrice") * oi."quantity"), 0)::numeric(14,2) AS total_profit
FROM "Product" p
LEFT JOIN "OrderItem" oi ON oi."productId" = p."id"
LEFT JOIN "Order" o ON o."id" = oi."orderId"
WHERE p."deletedAt" IS NULL AND (o."id" IS NULL OR o."status" IN ('CONFIRMED', 'DISPATCHED', 'DELIVERED'))
GROUP BY p."id", p."name", p."productType";

CREATE OR REPLACE VIEW public.order_details_view AS
SELECT
  o."id" AS order_id,
  o."orderNumber",
  o."status" AS order_status,
  o."deliveryMethod",
  o."totalAmount",
  o."createdAt",
  u."firstName" || ' ' || u."lastName" AS customer_name,
  dz."zoneName" AS delivery_zone,
  dz."city" AS delivery_city,
  pm."status" AS payment_status,
  pm."method" AS payment_method,
  d."status" AS delivery_status
FROM "Order" o
LEFT JOIN "User" u ON u."id" = o."customerId"
LEFT JOIN "DeliveryZone" dz ON dz."id" = o."deliveryZoneId"
LEFT JOIN LATERAL (
  SELECT p."status", p."method"
  FROM "Payment" p
  WHERE p."orderId" = o."id"
  ORDER BY p."createdAt" DESC
  LIMIT 1
) pm ON TRUE
LEFT JOIN "Delivery" d ON d."orderId" = o."id"
WHERE o."deletedAt" IS NULL;

CREATE OR REPLACE FUNCTION public.calculate_profit_range(p_from timestamptz, p_to timestamptz)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  units_sold int,
  gross_sales numeric,
  gross_profit numeric
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p."id" AS product_id,
    p."name"::text AS product_name,
    COALESCE(SUM(oi."quantity"), 0)::int AS units_sold,
    COALESCE(SUM(oi."totalPrice"), 0)::numeric AS gross_sales,
    COALESCE(SUM((oi."unitPrice" - p."costPrice") * oi."quantity"), 0)::numeric AS gross_profit
  FROM "Product" p
  LEFT JOIN "OrderItem" oi ON oi."productId" = p."id"
  LEFT JOIN "Order" o ON o."id" = oi."orderId"
  WHERE o."createdAt" BETWEEN p_from AND p_to
    AND o."status" IN ('CONFIRMED', 'DISPATCHED', 'DELIVERED')
  GROUP BY p."id", p."name";
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_monthly_report(p_year int, p_month int)
RETURNS TABLE (
  report_day date,
  total_orders int,
  total_sales numeric,
  total_profit numeric
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(o."createdAt") AS report_day,
    COUNT(DISTINCT o."id")::int AS total_orders,
    COALESCE(SUM(o."totalAmount"), 0)::numeric AS total_sales,
    COALESCE(SUM((oi."unitPrice" - p."costPrice") * oi."quantity"), 0)::numeric AS total_profit
  FROM "Order" o
  LEFT JOIN "OrderItem" oi ON oi."orderId" = o."id"
  LEFT JOIN "Product" p ON p."id" = oi."productId"
  WHERE EXTRACT(YEAR FROM o."createdAt") = p_year
    AND EXTRACT(MONTH FROM o."createdAt") = p_month
    AND o."status" IN ('CONFIRMED', 'DISPATCHED', 'DELIVERED')
  GROUP BY DATE(o."createdAt")
  ORDER BY report_day ASC;
END;
$$ LANGUAGE plpgsql;
