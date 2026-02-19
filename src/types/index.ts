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
