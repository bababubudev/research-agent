-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Documents table for storing chunked content + embeddings
create table if not exists documents (
  id bigserial primary key,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding vector(1536)
);

-- HNSW index for fast similarity search
create index on documents using hnsw (embedding vector_cosine_ops);

-- RPC function: match documents by embedding similarity
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 5
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
  order by embedding <=> query_embedding
  limit match_count;
$$;
