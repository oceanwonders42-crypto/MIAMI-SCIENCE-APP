-- Phase 8C: Shipment webhook ingestion — stable id for upsert
-- Run after 00006

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_external_id ON shipments(external_id) WHERE external_id IS NOT NULL;
