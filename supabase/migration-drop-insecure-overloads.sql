-- Migration: Drop insecure zero-argument function overloads
-- These were introduced in migration-chat-history.sql before auth was added.
-- They have no search_path set and no user filtering, exposing all users' data.
-- The secure replacements (with p_user_id and SET search_path) exist in migration-auth.sql.

DROP FUNCTION IF EXISTS public.list_document_sources();
DROP FUNCTION IF EXISTS public.delete_documents_by_source(text);
