import { embed, embedMany } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getAdminClient } from "./supabase/admin";
import type { MatchedDocument } from "@/types";

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

/** Embed and store document chunks in Supabase.
 *  If chunks for the same source already exist for this user, they are replaced.
 *  New chunks are inserted first so a failure during embedding leaves the old
 *  data intact. Old chunks are deleted only after a successful insert.
 */
export async function ingestDocument(
  content: string,
  metadata: Record<string, unknown> = {},
  userId: string,
  apiKey: string
) {
  const openai = createOpenAI({ apiKey });
  const embeddingModel = openai.embedding("text-embedding-3-small");
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

  // Capture IDs of any existing chunks for this source before inserting new ones
  const source = metadata.source as string | undefined;
  let oldIds: number[] = [];
  if (source) {
    const { data } = await getAdminClient()
      .from("documents")
      .select("id")
      .eq("user_id", userId)
      .filter("metadata->>source", "eq", source);
    oldIds = (data ?? []).map((r: { id: number }) => r.id);
  }

  const { error } = await getAdminClient().from("documents").insert(rows);
  if (error) throw error;

  // Delete the old chunks only after the new ones are safely written
  if (oldIds.length > 0) {
    await getAdminClient().from("documents").delete().in("id", oldIds);
  }

  return { chunksStored: rows.length, replaced: oldIds.length > 0 };
}

/** Retrieve documents similar to the query. */
export async function retrieveContext(
  query: string,
  matchCount = 5,
  threshold = 0.5,
  sourceFilters?: string[],
  userId?: string,
  apiKey?: string
): Promise<MatchedDocument[]> {
  const openai = createOpenAI({ apiKey });
  const embeddingModel = openai.embedding("text-embedding-3-small");
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
