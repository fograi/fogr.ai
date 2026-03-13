-- sale_price: optional sold price recorded when owner marks ad as sold
-- Stored in cents (same pattern as existing price column)
-- Nullable: only set when seller provides a sale price during mark-as-sold flow

ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS sale_price integer;

-- Currency constraint verification:
-- The ads table currency column has no CHECK constraint limiting values.
-- Validation is handled in application code (ads-validation.ts) using /^[A-Z]{3}$/
-- which already accepts GBP alongside EUR. No DB constraint change needed.
