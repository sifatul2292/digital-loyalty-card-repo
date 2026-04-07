-- Add redemption code to rewards
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS redemption_code TEXT;

-- Index for quick lookup by staff
CREATE INDEX IF NOT EXISTS idx_rewards_redemption_code ON public.rewards(redemption_code);
