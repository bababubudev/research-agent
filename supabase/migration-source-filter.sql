-- Migration: Add source filtering support to match_documents
-- Run this in Supabase SQL Editor after the initial setup.sql

create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 5,
  source_filters text[] default null
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  from documents
  where 1 - (embedding <=> query_embedding) > match_threshold
    and (source_filters is null or metadata->>'source' = any(source_filters))
  order by embedding <=> query_embedding
  limit match_count;
$$;
