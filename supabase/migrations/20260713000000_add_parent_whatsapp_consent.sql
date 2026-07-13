-- Record explicit consent before enabling direct WhatsApp learning updates.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS parent_whatsapp_consent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.parent_whatsapp_consent_at IS
'When the learner confirmed their parent or guardian agreed to receive WhatsApp learning updates.';
