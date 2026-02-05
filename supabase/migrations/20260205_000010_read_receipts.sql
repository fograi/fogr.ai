-- Read receipt timestamps for conversations

ALTER TABLE public.conversations
	ADD COLUMN IF NOT EXISTS buyer_last_read_at timestamptz,
	ADD COLUMN IF NOT EXISTS seller_last_read_at timestamptz;

-- Backfill to avoid marking old threads as unread
UPDATE public.conversations
SET buyer_last_read_at = COALESCE(buyer_last_read_at, last_message_at),
	seller_last_read_at = COALESCE(seller_last_read_at, last_message_at)
WHERE last_message_at IS NOT NULL;
