-- String & Racket Finder — database schema (run once in the Neon SQL editor)

create table if not exists users (
  id          bigint generated always as identity primary key,
  email       text unique not null,
  created_at  timestamptz not null default now()
);

-- one-time login tokens for the magic link
create table if not exists login_tokens (
  token       text primary key,           -- random 48-byte hex
  email       text not null,
  expires_at  timestamptz not null,
  used        boolean not null default false
);

-- each user's preference bundle — the PREF/intro/theme object as one JSON pocket
create table if not exists profiles (
  user_id     bigint primary key references users(id) on delete cascade,
  prefs       jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);

-- the gear catalogue (seeded from the app, then maintained here)
create table if not exists rackets (
  no          int primary key,
  brand       text not null,
  name        text not null,
  grp         text not null default 'bench',
  scores      jsonb not null,             -- the 11 axis scores
  difficulty  int not null,
  price       numeric,
  specs       jsonb not null              -- weight, head, pattern, RA, ...
);

create table if not exists strings (
  idx         int primary key,
  mains       text not null,
  crosses     text not null,
  scores      jsonb not null,             -- the 8 axis scores
  tech        jsonb                       -- material, gauge, stiffness class, price...
);

-- the chatroom
create table if not exists posts (
  id          bigint generated always as identity primary key,
  user_id     bigint not null references users(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  racket_ref  text,
  string_ref  text,
  photo_url   text,
  hidden      boolean not null default false,   -- your moderation switch
  created_at  timestamptz not null default now()
);

create index if not exists posts_feed on posts (created_at desc) where not hidden;
