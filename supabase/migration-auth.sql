-- ============================================================
-- Auth Migration: Add user_id columns, RLS policies, and
-- update RPC functions for user-scoped data.
-- Run this in Supabase SQL Editor after previous migrations.
-- ============================================================

-- ============================================================
-- 1. Clear existing data (no user_id to backfill), then add columns
-- ============================================================

DELETE FROM messages;
DELETE FROM conversations;
DELETE FROM documents;

ALTER TABLE conversations
  ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX idx_conversations_user_id ON conversations (user_id);

ALTER TABLE documents
  ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX idx_documents_user_id ON documents (user_id);

-- ============================================================
-- 2. Enable RLS
-- ============================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. RLS Policies — conversations
-- ============================================================

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 3b. RLS Policies — messages (scoped via parent conversation)
-- ============================================================

CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in own conversations"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );

-- ============================================================
-- 3c. RLS Policies — documents
-- ============================================================

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. Recreate RPC functions as SECURITY DEFINER with user_id
-- ============================================================

CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  source_filters text[] DEFAULT NULL,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
    AND user_id = p_user_id
    AND (source_filters IS NULL OR metadata->>'source' = ANY(source_filters))
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION list_document_sources (
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (source text, chunk_count bigint)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    coalesce(metadata->>'source', 'Unknown') AS source,
    count(*) AS chunk_count
  FROM documents
  WHERE user_id = p_user_id
  GROUP BY metadata->>'source'
  ORDER BY max(id) DESC;
$$;

CREATE OR REPLACE FUNCTION delete_documents_by_source (
  target_source text,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  DELETE FROM documents
  WHERE metadata->>'source' = target_source
    AND user_id = p_user_id;
$$;
