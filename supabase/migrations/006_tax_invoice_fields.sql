-- 006_tax_invoice_fields.sql
-- Add fields for tax invoice and withholding tax capability

-- For company: can issue tax invoice (ใบกำกับภาษี)
ALTER TABLE shops ADD COLUMN IF NOT EXISTS can_issue_tax_invoice BOOLEAN DEFAULT false;

-- For individual: can issue withholding tax certificate (หนังสือหัก ณ ที่จ่าย)
ALTER TABLE shops ADD COLUMN IF NOT EXISTS can_issue_withholding_tax BOOLEAN DEFAULT false;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_shops_tax_invoice ON shops(can_issue_tax_invoice) WHERE can_issue_tax_invoice = true;
CREATE INDEX IF NOT EXISTS idx_shops_withholding_tax ON shops(can_issue_withholding_tax) WHERE can_issue_withholding_tax = true;
