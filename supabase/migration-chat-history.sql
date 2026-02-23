-- ============================================================
-- Chat History Persistence: conversations + messages tables
-- Run this in your Supabase SQL Editor after setup.sql
-- ============================================================

-- Conversations table
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'New Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on conversations (updated_at desc);

-- Messages table (cascading delete with conversation)
create table if not exists messages (
  id text primary key,
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  parts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index on messages (conversation_id, created_at asc);

-- Auto-update updated_at on conversations when a message is inserted
create or replace function update_conversation_timestamp()
returns trigger
language plpgsql
as $$
begin
  update conversations set updated_at = now() where id = NEW.conversation_id;
  return NEW;
end;
$$;

create or replace trigger trg_update_conversation_timestamp
  after insert on messages
  for each row
  execute function update_conversation_timestamp();

-- ============================================================
-- Helper RPCs
-- ============================================================

-- List distinct document sources with chunk counts
create or replace function list_document_sources()
returns table (source text, chunk_count bigint)
language sql stable
set search_path = public, extensions
as $$
  select
    coalesce(metadata->>'source', 'Unknown') as source,
    count(*) as chunk_count
  from documents
  group by metadata->>'source'
  order by max(id) desc;
$$;

-- Delete all document chunks for a given source
create or replace function delete_documents_by_source(target_source text)
returns void
language sql
as $$
  delete from documents
  where metadata->>'source' = target_source;
$$;
