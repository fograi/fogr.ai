-- Messaging + offer rules

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Offer controls on ads
ALTER TABLE public.ads
	ADD COLUMN IF NOT EXISTS firm_price boolean NOT NULL DEFAULT false,
	ADD COLUMN IF NOT EXISTS min_offer integer,
	ADD COLUMN IF NOT EXISTS auto_decline_message text;

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
	buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	last_message_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS conversations_unique_pair
	ON public.conversations (ad_id, buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS conversations_ad_id_idx
	ON public.conversations (ad_id);
CREATE INDEX IF NOT EXISTS conversations_buyer_id_idx
	ON public.conversations (buyer_id);
CREATE INDEX IF NOT EXISTS conversations_seller_id_idx
	ON public.conversations (seller_id);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
	sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	kind text NOT NULL,
	body text NOT NULL,
	offer_amount integer,
	delivery_method text,
	timing text,
	auto_declined boolean NOT NULL DEFAULT false,
	scam_warning boolean NOT NULL DEFAULT false,
	scam_reason text,
	created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx
	ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx
	ON public.messages (sender_id);

-- RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversations read by participants" ON public.conversations;
CREATE POLICY "Conversations read by participants"
	ON public.conversations
	FOR SELECT
	TO authenticated
	USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Conversations insert by buyer" ON public.conversations;
CREATE POLICY "Conversations insert by buyer"
	ON public.conversations
	FOR INSERT
	TO authenticated
	WITH CHECK (auth.uid() = buyer_id AND buyer_id <> seller_id);

DROP POLICY IF EXISTS "Conversations update by participants" ON public.conversations;
CREATE POLICY "Conversations update by participants"
	ON public.conversations
	FOR UPDATE
	TO authenticated
	USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Messages read by participants" ON public.messages;
CREATE POLICY "Messages read by participants"
	ON public.messages
	FOR SELECT
	TO authenticated
	USING (
		EXISTS (
			SELECT 1
			FROM public.conversations c
			WHERE c.id = conversation_id
				AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
		)
	);

DROP POLICY IF EXISTS "Messages insert by participants" ON public.messages;
CREATE POLICY "Messages insert by participants"
	ON public.messages
	FOR INSERT
	TO authenticated
	WITH CHECK (
		auth.uid() = sender_id
		AND EXISTS (
			SELECT 1
			FROM public.conversations c
			WHERE c.id = conversation_id
				AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
		)
	);
