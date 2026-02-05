-- Direct contact reveal gating

ALTER TABLE public.ads
	ADD COLUMN IF NOT EXISTS direct_contact_enabled boolean NOT NULL DEFAULT false;
