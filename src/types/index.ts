export interface DocumentChunk {
  id: number;
  content: string;
  metadata: DocumentMetadata;
  embedding?: number[];
}

export interface DocumentMetadata {
  source?: string;
  title?: string;
  chunk_index?: number;
  [key: string]: unknown;
}

export interface MatchedDocument {
  id: number;
  content: string;
  metadata: DocumentMetadata;
  similarity: number;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentSource {
  source: string;
  chunk_count: number;
}

export interface CitationDetail {
  source: string;
  content: string;
}

export interface ChatMessageMetadata {
  sources?: Record<string, string>; // "1" -> "project-docs.pdf", "2" -> "api-guide.md"
  citations?: Record<string, CitationDetail>; // "1" -> { source, content }
}
