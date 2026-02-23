# Research Agent

A smart documentation search assistant powered by RAG (Retrieval-Augmented Generation). Upload your documents, then ask questions — answers are grounded in your content with inline citations that link back to the exact retrieved passage.

## Features

- **RAG pipeline** — documents are chunked, embedded, and stored in a pgvector index; queries retrieve the most relevant chunks before generation
- **Streamed responses** — real-time streaming via Vercel AI SDK
- **Inline citations** — LLM cites sources as `[1]`, `[2]`, etc.; clicking a badge or source button reveals the exact chunk the answer came from
- **Document management** — upload `.txt`, `.md`, `.pdf`, paste raw text, or ingest from a URL; re-uploading a document by the same name replaces it cleanly
- **Conversation history** — chats are persisted per user with full message history
- **Authentication** — user accounts via Supabase Auth; all data is scoped per user with Row Level Security
- **Source filtering** — pin specific documents to narrow retrieval to a known knowledge base

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS + daisyUI |
| Database / Vector Store | Supabase (PostgreSQL + pgvector) |
| AI Orchestration | Vercel AI SDK (`streamText`, `useChat`) |
| LLM | OpenAI GPT-4o |
| Embeddings | OpenAI text-embedding-3-small (1536 dims) |
| Auth | Supabase Auth |
| Deployment | Vercel |

## Architecture

```
User → Next.js Chat UI
     → POST /api/chat
     → embed query (text-embedding-3-small)
     → pgvector similarity search (Supabase)
     → inject top-k chunks as context
     → OpenAI GPT-4o (streamText)
     → streamed response with [N] citations
```

All OpenAI and Supabase service keys are server-side only. The client never touches them directly.

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example below into `.env.local`:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase (server-side — never exposed to the browser)
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Supabase (public — safe for the browser)
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

### 3. Set up Supabase

Run the following SQL files in order in the **Supabase SQL Editor**:

| File | Purpose |
|---|---|
| `supabase/setup.sql` | pgvector extension, `documents` table, HNSW index, `match_documents` RPC |
| `supabase/migration-chat-history.sql` | `conversations` and `messages` tables, helper RPCs |
| `supabase/migration-auth.sql` | Adds `user_id` columns, enables Row Level Security, updates RPCs to be user-scoped |
| `supabase/migration-source-filter.sql` | Adds source-filter support to `match_documents` |
| `supabase/migration-drop-insecure-overloads.sql` | Removes unauthenticated RPC overloads |

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Document Ingestion

Documents can be added from the sidebar using three modes:

- **Paste Text** — paste plain text with an optional title
- **Upload File** — `.txt`, `.md`, or `.pdf` up to 10 MB
- **From URL** — fetches a web page and strips HTML

Uploaded content is split into ~1000-character chunks at paragraph boundaries, embedded with `text-embedding-3-small`, and stored in Supabase. Re-uploading a document with the same source name replaces the previous version (new chunks are inserted first, old chunks deleted after, so a failed upload never destroys existing data).

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # ESLint
```

## Deployment

Deploy to [Vercel](https://vercel.com). Set the same environment variables from step 2 in your Vercel project settings. No other configuration is needed.
