-- Phase 1 hardening migration: integrity links, constraints, triggers, and reporting helpers.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Missing foreign keys that were modeled logically but not enforced physically yet.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserRole_assignedById_fkey'
  ) THEN
    ALTER TABLE "public"."UserRole"
      ADD CONSTRAINT "UserRole_assignedById_fkey"
      FOREIGN KEY ("assignedById") REFERENCES "public"."User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StockMovement_createdById_fkey'
  ) THEN
    ALTER TABLE "public"."StockMovement"
      ADD CONSTRAINT "StockMovement_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "public"."User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Payment_confirmedById_fkey'
  ) THEN
    ALTER TABLE "public"."Payment"
      ADD CONSTRAINT "Payment_confirmedById_fkey"
      FOREIGN KEY ("confirmedById") REFERENCES "public"."User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Message_orderId_fkey'
  ) THEN
    ALTER TABLE "public"."Message"
      ADD CONSTRAINT "Message_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ReportSnapshot_generatedById_fkey'
  ) THEN
    ALTER TABLE "public"."ReportSnapshot"
      ADD CONSTRAINT "ReportSnapshot_generatedById_fkey"
      FOREIGN KEY ("generatedById") REFERENCES "public"."User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Missing indexes for new relational links.
CREATE INDEX IF NOT EXISTS "UserRole_assignedById_idx" ON "public"."UserRole"("assignedById");
CREATE INDEX IF NOT EXISTS "StockMovement_createdById_idx" ON "public"."StockMovement"("createdById");
CREATE INDEX IF NOT EXISTS "Payment_confirmedById_idx" ON "public"."Payment"("confirmedById");
CREATE INDEX IF NOT EXISTS "Message_orderId_idx" ON "public"."Message"("orderId");
CREATE INDEX IF NOT EXISTS "ReportSnapshot_generatedById_idx" ON "public"."ReportSnapshot"("generatedById");

-- Business integrity checks.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Order_amounts_non_negative_chk'
  ) THEN
    ALTER TABLE "public"."Order"
      ADD CONSTRAINT "Order_amounts_non_negative_chk"
      CHECK (
        "subtotalAmount" >= 0
        AND "deliveryAmount" >= 0
        AND "totalAmount" >= 0
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Order_total_consistency_chk'
  ) THEN
    ALTER TABLE "public"."Order"
      ADD CONSTRAINT "Order_total_consistency_chk"
      CHECK (
        "totalAmount" = ("subtotalAmount" + "deliveryAmount")
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_quantity_positive_chk'
  ) THEN
    ALTER TABLE "public"."OrderItem"
      ADD CONSTRAINT "OrderItem_quantity_positive_chk"
      CHECK ("quantity" > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_prices_non_negative_chk'
  ) THEN
    ALTER TABLE "public"."OrderItem"
      ADD CONSTRAINT "OrderItem_prices_non_negative_chk"
      CHECK ("unitPrice" >= 0 AND "totalPrice" >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Payment_amount_positive_chk'
  ) THEN
    ALTER TABLE "public"."Payment"
      ADD CONSTRAINT "Payment_amount_positive_chk"
      CHECK ("amount" > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Stock_non_negative_chk'
  ) THEN
    ALTER TABLE "public"."Stock"
      ADD CONSTRAINT "Stock_non_negative_chk"
      CHECK ("quantityOnHand" >= 0 AND "reorderLevel" >= 0);
  END IF;
END $$;

-- Timestamp trigger helper used for direct SQL updates outside Prisma.
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Keep updatedAt values consistent even for direct SQL writes.
DROP TRIGGER IF EXISTS trg_set_timestamp_user ON "User";
CREATE TRIGGER trg_set_timestamp_user
BEFORE UPDATE ON "User"
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_role ON "Role";
CREATE TRIGGER trg_set_timestamp_role
BEFORE UPDATE ON "Role"
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_category ON "Category";
CREATE TRIGGER trg_set_timestamp_category
BEFORE UPDATE ON "Category"
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_product ON "Product";
CREATE TRIGGER trg_set_timestamp_product
BEFORE UPDATE ON "Product"
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_stock ON "Stock";
CREATE TRIGGER trg_set_timestamp_stock
BEFORE UPDATE ON "Stock"
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_delivery_zone ON "DeliveryZone";
CREATE TRIGGER trg_set_timestamp_delivery_zone
BEFORE UPDATE ON "DeliveryZone"
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_rider ON "Rider";
CREATE TRIGGER trg_set_timestamp_rider
BEFORE UPDATE ON "Rider"
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_order ON "Order";
CREATE TRIGGER trg_set_timestamp_order
BEFORE UPDATE ON "Order"
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_delivery ON "Delivery";
CREATE TRIGGER trg_set_timestamp_delivery
BEFORE UPDATE ON "Delivery"
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_payment ON "Payment";
CREATE TRIGGER trg_set_timestamp_payment
BEFORE UPDATE ON "Payment"
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_review ON "Review";
CREATE TRIGGER trg_set_timestamp_review
BEFORE UPDATE ON "Review"
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

-- Prevent negative stock at database level.
CREATE OR REPLACE FUNCTION public.prevent_negative_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."quantityOnHand" < 0 THEN
    RAISE EXCEPTION 'Stock cannot be negative for product %', NEW."productId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_negative_stock ON "Stock";
CREATE TRIGGER trg_prevent_negative_stock
BEFORE INSERT OR UPDATE ON "Stock"
FOR EACH ROW EXECUTE FUNCTION public.prevent_negative_stock();

-- Keep product low-stock flag synchronized with stock table.
CREATE OR REPLACE FUNCTION public.sync_product_low_stock_flag()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "Product"
  SET
    "isLowStock" = NEW."quantityOnHand" <= NEW."reorderLevel",
    "updatedAt" = NOW()
  WHERE "id" = NEW."productId";

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_product_low_stock ON "Stock";
CREATE TRIGGER trg_sync_product_low_stock
AFTER INSERT OR UPDATE ON "Stock"
FOR EACH ROW EXECUTE FUNCTION public.sync_product_low_stock_flag();

-- Tighten stock application flow to avoid duplicate decrements.
CREATE OR REPLACE FUNCTION public.apply_stock_for_confirmed_payment()
RETURNS TRIGGER AS $$
DECLARE
  has_sale_movements boolean;
BEGIN
  IF NEW."status" = 'CONFIRMED' AND (OLD."status" IS DISTINCT FROM 'CONFIRMED') THEN
    SELECT EXISTS (
      SELECT 1
      FROM "StockMovement" sm
      INNER JOIN "OrderItem" oi ON oi."id" = sm."orderItemId"
      WHERE oi."orderId" = NEW."orderId"
        AND sm."movementType" = 'SALE'
    ) INTO has_sale_movements;

    IF has_sale_movements THEN
      RETURN NEW;
    END IF;

    UPDATE "Order"
    SET "status" = 'CONFIRMED', "updatedAt" = NOW()
    WHERE "id" = NEW."orderId" AND "status" = 'PENDING';

    UPDATE "Stock" s
    SET
      "quantityOnHand" = s."quantityOnHand" - oi."quantity",
      "updatedAt" = NOW()
    FROM "OrderItem" oi
    WHERE oi."orderId" = NEW."orderId"
      AND s."productId" = oi."productId";

    INSERT INTO "StockMovement"(
      "id", "productId", "orderItemId", "movementType", "quantityChange", "reason", "createdById", "createdAt"
    )
    SELECT
      gen_random_uuid(),
      oi."productId",
      oi."id",
      'SALE'::"StockMovementType",
      -oi."quantity",
      'Auto decrement after payment confirmation',
      NEW."confirmedById",
      NOW()
    FROM "OrderItem" oi
    WHERE oi."orderId" = NEW."orderId";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_confirm_stock ON "Payment";
CREATE TRIGGER trg_payment_confirm_stock
AFTER UPDATE ON "Payment"
FOR EACH ROW EXECUTE FUNCTION public.apply_stock_for_confirmed_payment();

-- Lightweight transactional helper for payment confirmation workflows.
CREATE OR REPLACE FUNCTION public.confirm_payment_atomic(
  p_payment_id uuid,
  p_confirmed_by uuid,
  p_reference text DEFAULT NULL
)
RETURNS void
AS $$
BEGIN
  UPDATE "Payment"
  SET
    "status" = 'CONFIRMED',
    "confirmedById" = p_confirmed_by,
    "reference" = COALESCE(p_reference, "reference"),
    "confirmedAt" = NOW(),
    "updatedAt" = NOW()
  WHERE "id" = p_payment_id
    AND "status" = 'PENDING';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment % is not in PENDING state or does not exist', p_payment_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Required advanced function for low-stock retrieval.
CREATE OR REPLACE FUNCTION public.get_low_stock_alerts()
RETURNS TABLE (
  product_id uuid,
  sku text,
  product_name text,
  quantity_on_hand int,
  reorder_level int,
  is_low_stock boolean
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p."id" AS product_id,
    p."sku"::text AS sku,
    p."name"::text AS product_name,
    s."quantityOnHand"::int AS quantity_on_hand,
    s."reorderLevel"::int AS reorder_level,
    (s."quantityOnHand" <= s."reorderLevel") AS is_low_stock
  FROM "Product" p
  INNER JOIN "Stock" s ON s."productId" = p."id"
  WHERE p."deletedAt" IS NULL
    AND s."quantityOnHand" <= s."reorderLevel"
  ORDER BY s."quantityOnHand" ASC, p."name" ASC;
END;
$$ LANGUAGE plpgsql;

-- Expand audit coverage for key operational tables.
DROP TRIGGER IF EXISTS trg_audit_category ON "Category";
CREATE TRIGGER trg_audit_category
AFTER INSERT OR UPDATE ON "Category"
FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

DROP TRIGGER IF EXISTS trg_audit_stock ON "Stock";
CREATE TRIGGER trg_audit_stock
AFTER INSERT OR UPDATE ON "Stock"
FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

DROP TRIGGER IF EXISTS trg_audit_delivery ON "Delivery";
CREATE TRIGGER trg_audit_delivery
AFTER INSERT OR UPDATE ON "Delivery"
FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

DROP TRIGGER IF EXISTS trg_audit_review ON "Review";
CREATE TRIGGER trg_audit_review
AFTER INSERT OR UPDATE ON "Review"
FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
