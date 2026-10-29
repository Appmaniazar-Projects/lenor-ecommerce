-- Lenor website storage on Supabase.
-- Run once: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to run again.

-- Each record keeps the app's full JSON in `data`, plus the columns we
-- search or filter on.

create table if not exists public.lenor_users (
  id uuid primary key,
  email text not null unique,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lenor_quotes (
  id uuid primary key,
  quote_number text not null unique,
  user_id uuid,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists lenor_quotes_user_idx on public.lenor_quotes (user_id, created_at desc);

create table if not exists public.lenor_orders (
  id uuid primary key,
  order_number text not null unique,
  user_id uuid not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists lenor_orders_user_idx on public.lenor_orders (user_id, created_at desc);

create table if not exists public.lenor_uploads (
  id uuid primary key,
  user_id uuid,
  -- false until the file has arrived in storage and passed the checks
  verified boolean not null default false,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- Only the website's server (service role key) may touch these tables.
-- Row level security with no policies blocks the public anon key.
alter table public.lenor_users enable row level security;
alter table public.lenor_quotes enable row level security;
alter table public.lenor_orders enable row level security;
alter table public.lenor_uploads enable row level security;

-- Private file buckets: logos, and a cached copy of the Amrod catalogue.
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('lenor-logos', 'lenor-logos', false, 20971520),
  ('lenor-cache', 'lenor-cache', false, null)
on conflict (id) do nothing;
