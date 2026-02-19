# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Documentation Search Autonomous Research Agent using RAG (Retrieval-Augmented Generation). The project is a chat-based interface that lets users query documentation, with answers grounded in retrieved context and cited sources.

## Tech Stack

- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: Tailwind CSS + daisyUI
- **Database / Vector Store**: Supabase (PostgreSQL + pgvector extension)
- **AI Orchestration**: Vercel AI SDK (`ai` package) — `streamText`, `useChat`/`useAssistant`
- **LLM**: OpenAI GPT-4o (text generation), text-embedding-3-small (embeddings)
- **Deployment target**: Vercel

## Architecture

```
User → Next.js Chat UI (useChat) → API Route Handler → [embed query → Supabase pgvector similarity search → inject context] → OpenAI streamText → streamed response with citations
```

Key architectural constraints from the spec:
- **All API keys server-side only** — OpenAI and Supabase service keys must never reach the client. Use Route Handlers or Server Actions exclusively.
- **RAG pipeline**: chunk documents → generate embeddings → store in Supabase pgvector → on query, embed the question → similarity search → inject retrieved chunks as context in the LLM prompt.
- **Streaming**: Real-time response streaming via Vercel AI SDK.
- **Citation**: LLM is instructed to answer only from provided context and cite sources (badges/footnotes).

## Design Reference

UI mockups are in `Design&UI/`:
- `design1.jpg` — Light-themed card layout with sidebar navigation (reference for general layout patterns)
- `design2.png` — **Primary target**: Dark theme chat interface with green accent color, sidebar menu, central chat area, input field with send button

## Commands (once project is initialized)

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

## Supabase Setup

The project requires pgvector enabled in Supabase and an embeddings table. SQL setup should be run in Supabase SQL Editor before the app can function.
