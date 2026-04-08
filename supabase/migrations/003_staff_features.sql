-- Add staff PIN to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS staff_pin TEXT;

-- Add redeemed_at to rewards (for accurate per-cycle stamp counting)
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMPTZ;

-- Add redemption_code to rewards if not already there
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS redemption_code TEXT;
CREATE INDEX IF NOT EXISTS idx_rewards_redemption_code ON public.rewards(redemption_code);
