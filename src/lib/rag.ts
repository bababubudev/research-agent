import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { getAdminClient } from "./supabase/admin";
import type { MatchedDocument } from "@/types";

const embeddingModel = openai.textEmbedding("text-embedding-3-small");

/** Split text into chunks of roughly `maxChars`, breaking at paragraph boundaries. */
export function chunkText(text: string, maxChars = 1000): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += para + "\n\n";
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/** Embed and store document chunks in Supabase. */
export async function ingestDocument(
  content: string,
  metadata: Record<string, unknown> = {},
  userId: string
) {
  const chunks = chunkText(content);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });

  const rows = chunks.map((chunk, i) => ({
    content: chunk,
    metadata: { ...metadata, chunk_index: i },
    embedding: embeddings[i],
    user_id: userId,
  }));

  const { error } = await getAdminClient().from("documents").insert(rows);
  if (error) throw error;

  return { chunksStored: rows.length };
}

/** Retrieve documents similar to the query. */
export async function retrieveContext(
  query: string,
  matchCount = 5,
  threshold = 0.5,
  sourceFilters?: string[],
  userId?: string
): Promise<MatchedDocument[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: query,
  });

  const { data, error } = await getAdminClient().rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: matchCount,
    source_filters: sourceFilters?.length ? sourceFilters : null,
    p_user_id: userId,
  });

  if (error) throw error;
  return (data as MatchedDocument[]) ?? [];
}

/** Format retrieved documents into a context string for the LLM prompt. */
export function formatContext(docs: MatchedDocument[]): string {
  if (docs.length === 0) return "No relevant documents found.";

  return docs
    .map((doc, i) => {
      const source = doc.metadata?.source ?? doc.metadata?.title ?? `Document ${doc.id}`;
      return `[${i + 1}] (Source: ${source})\n${doc.content}`;
    })
    .join("\n\n---\n\n");
}
