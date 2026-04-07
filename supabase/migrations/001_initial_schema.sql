-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Businesses table
create table if not exists public.businesses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null,
  logo_url text,
  reward_threshold integer not null default 10,
  reward_name text not null default 'Free Item',
  win_back_enabled boolean not null default false,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now()
);

-- Customers table
create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  phone text not null,
  name text not null,
  birthday date,
  business_id uuid references public.businesses(id) on delete cascade not null,
  card_token text unique not null default uuid_generate_v4()::text,
  created_at timestamptz not null default now(),
  unique(phone, business_id)
);

-- Stamps table
create table if not exists public.stamps (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references public.customers(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete cascade not null,
  created_at timestamptz not null default now()
);

-- Rewards table
create table if not exists public.rewards (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references public.customers(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete cascade not null,
  redeemed boolean not null default false,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS Policies
alter table public.businesses enable row level security;
alter table public.customers enable row level security;
alter table public.stamps enable row level security;
alter table public.rewards enable row level security;

-- Businesses: owners can manage their own
create policy "Owners manage own business" on public.businesses
  for all using (owner_id = auth.uid());

-- Customers: business owners can manage their customers
create policy "Business owners manage customers" on public.customers
  for all using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

-- Public customer card view (by token)
create policy "Public card token read" on public.customers
  for select using (true);

-- Stamps: business owners can manage
create policy "Business owners manage stamps" on public.stamps
  for all using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

-- Public stamps read for card display
create policy "Public stamps read" on public.stamps
  for select using (true);

-- Rewards: business owners can manage
create policy "Business owners manage rewards" on public.rewards
  for all using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

-- Public rewards read for card display
create policy "Public rewards read" on public.rewards
  for select using (true);

-- Indexes for performance
create index idx_customers_business on public.customers(business_id);
create index idx_customers_token on public.customers(card_token);
create index idx_stamps_customer on public.stamps(customer_id);
create index idx_stamps_business on public.stamps(business_id);
create index idx_rewards_customer on public.rewards(customer_id);
create index idx_rewards_business on public.rewards(business_id);
