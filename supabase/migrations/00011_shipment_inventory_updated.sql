-- Shipment-to-inventory: track when user has added delivered shipment to their stack
-- Run after 00010

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS inventory_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS inventory_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Allow users to update shipments for their own orders (e.g. set inventory_updated_at)
CREATE POLICY "Users can update shipments for own orders" ON shipments
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = shipments.order_id AND o.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = shipments.order_id AND o.user_id = auth.uid()));
