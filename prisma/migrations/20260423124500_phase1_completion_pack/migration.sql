-- Phase 1 completion pack: status-change auditing, atomic order placement helper, and stronger integrity checks.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enforce rating range for reviews.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Review_rating_range_chk'
  ) THEN
    ALTER TABLE "public"."Review"
      ADD CONSTRAINT "Review_rating_range_chk"
      CHECK ("rating" >= 1 AND "rating" <= 5);
  END IF;
END $$;

-- Generic status-change audit helper.
CREATE OR REPLACE FUNCTION public.audit_status_change()
RETURNS TRIGGER AS $$
DECLARE
  old_status text;
  new_status text;
BEGIN
  old_status := to_jsonb(OLD)->>'status';
  new_status := to_jsonb(NEW)->>'status';

  IF old_status IS DISTINCT FROM new_status THEN
    INSERT INTO "AuditLog"(
      "id", "actorUserId", "tableName", "recordId", "action", "oldData", "newData", "context", "createdAt"
    )
    VALUES (
      gen_random_uuid(),
      NULL,
      TG_TABLE_NAME,
      NEW."id"::text,
      'STATUS_CHANGE'::"AuditAction",
      jsonb_build_object('status', old_status),
      jsonb_build_object('status', new_status),
      jsonb_build_object('trigger', TG_NAME),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_order_status_change ON "Order";
CREATE TRIGGER trg_audit_order_status_change
AFTER UPDATE ON "Order"
FOR EACH ROW EXECUTE FUNCTION public.audit_status_change();

DROP TRIGGER IF EXISTS trg_audit_payment_status_change ON "Payment";
CREATE TRIGGER trg_audit_payment_status_change
AFTER UPDATE ON "Payment"
FOR EACH ROW EXECUTE FUNCTION public.audit_status_change();

DROP TRIGGER IF EXISTS trg_audit_delivery_status_change ON "Delivery";
CREATE TRIGGER trg_audit_delivery_status_change
AFTER UPDATE ON "Delivery"
FOR EACH ROW EXECUTE FUNCTION public.audit_status_change();

-- Atomic order placement helper (header + items + optional payment in one transaction).
CREATE OR REPLACE FUNCTION public.place_order_atomic(
  p_order_number text,
  p_customer_id uuid,
  p_delivery_zone_id uuid,
  p_delivery_method "DeliveryMethod",
  p_subtotal numeric,
  p_delivery_amount numeric,
  p_total numeric,
  p_notes text,
  p_items jsonb,
  p_payment_method "PaymentMethod" DEFAULT NULL,
  p_payment_amount numeric DEFAULT NULL
)
RETURNS uuid
AS $$
DECLARE
  v_order_id uuid := gen_random_uuid();
  v_item jsonb;
  v_order_item_id uuid;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order requires at least one item';
  END IF;

  INSERT INTO "Order"(
    "id", "orderNumber", "customerId", "deliveryZoneId", "status", "deliveryMethod",
    "subtotalAmount", "deliveryAmount", "totalAmount", "notes", "createdAt", "updatedAt"
  ) VALUES (
    v_order_id, p_order_number, p_customer_id, p_delivery_zone_id, 'PENDING', p_delivery_method,
    p_subtotal, p_delivery_amount, p_total, p_notes, NOW(), NOW()
  );

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_order_item_id := gen_random_uuid();

    INSERT INTO "OrderItem"(
      "id", "orderId", "productId", "quantity", "unitPrice", "totalPrice", "createdAt"
    ) VALUES (
      v_order_item_id,
      v_order_id,
      (v_item->>'productId')::uuid,
      (v_item->>'quantity')::int,
      (v_item->>'unitPrice')::numeric,
      (v_item->>'totalPrice')::numeric,
      NOW()
    );
  END LOOP;

  IF p_payment_method IS NOT NULL THEN
    INSERT INTO "Payment"(
      "id", "orderId", "method", "status", "amount", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(),
      v_order_id,
      p_payment_method,
      'PENDING',
      COALESCE(p_payment_amount, p_total),
      NOW(),
      NOW()
    );
  END IF;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;
