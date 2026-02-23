"use client";

import React, { Children, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CitationBadge from "./CitationBadge";
import { UserIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import type { UIMessage } from "ai";
import type { ChatMessageMetadata, CitationDetail } from "@/types";

interface ChatMessageProps {
  message: UIMessage;
}

/** Replace [N] patterns in React text children with CitationBadge components. */
function replaceCitations(
  children: ReactNode,
  sources?: Record<string, string>,
  activeCitation?: number | null,
  onCitationClick?: (n: number) => void
): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child !== "string") return child;
    const parts = child.split(/(\[\d+\])/g);
    if (parts.length === 1) return child;
    return parts
      .filter(Boolean)
      .map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/);
        if (!m) return <React.Fragment key={i}>{part}</React.Fragment>;
        const n = parseInt(m[1], 10);
        return (
          <CitationBadge
            key={i}
            number={n}
            sourceName={sources?.[m[1]]}
            active={activeCitation === n}
            onClick={onCitationClick ? () => onCitationClick(n) : undefined}
          />
        );
      });
  });
}

/** Build ReactMarkdown component overrides that inject citation badges. */
function buildMarkdownComponents(
  sources?: Record<string, string>,
  activeCitation?: number | null,
  onCitationClick?: (n: number) => void
) {
  const wrap = (children: ReactNode) =>
    replaceCitations(children, sources, activeCitation, onCitationClick);
  return {
    p: ({ children }: { children?: ReactNode }) => <p>{wrap(children)}</p>,
    li: ({ children }: { children?: ReactNode }) => <li>{wrap(children)}</li>,
    strong: ({ children }: { children?: ReactNode }) => <strong>{wrap(children)}</strong>,
    em: ({ children }: { children?: ReactNode }) => <em>{wrap(children)}</em>,
    td: ({ children }: { children?: ReactNode }) => <td>{wrap(children)}</td>,
    pre: ({ children }: { children?: ReactNode }) => (
      <pre className="overflow-x-auto">{children}</pre>
    ),
  };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [activeCitation, setActiveCitation] = useState<number | null>(null);

  const textContent = message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");

  const metadata = message.metadata as ChatMessageMetadata | undefined;
  const sources = metadata?.sources;
  const citations = metadata?.citations;

  // Sorted citation entries by key so buttons appear in order
  const citationEntries: [string, CitationDetail][] = citations
    ? (Object.entries(citations).sort((a, b) => Number(a[0]) - Number(b[0])) as [string, CitationDetail][])
    : [];

  const handleCitationClick = (n: number) => {
    setActiveCitation((prev) => (prev === n ? null : n));
  };

  const markdownComponents = buildMarkdownComponents(sources, activeCitation, handleCitationClick);

  const activeCitationDetail =
    activeCitation !== null ? citations?.[String(activeCitation)] : undefined;

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-sidebar)]">
          <BookOpenIcon className="h-4 w-4 text-[var(--color-accent-green)]" />
        </div>
      )}

      <div
        className={`max-w-[75%] overflow-hidden rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[var(--color-accent-green)] text-white"
            : "border border-[var(--color-border-subtle)] bg-white text-gray-800"
        }`}
      >
        {isUser ? (
          <p className="text-sm">{textContent}</p>
        ) : (
          <div className="prose prose-sm max-w-none break-words prose-p:my-1 prose-li:my-0 prose-pre:overflow-x-auto">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {textContent}
            </ReactMarkdown>
          </div>
        )}

        {/* Citation detail panel */}
        {activeCitationDetail && (
          <div className="mt-3 rounded-lg border border-[var(--color-accent-green)] bg-green-50 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-accent-green)]">
                [{activeCitation}] {activeCitationDetail.source}
              </span>
              <button
                onClick={() => setActiveCitation(null)}
                className="ml-2 text-gray-400 hover:text-gray-600"
                aria-label="Close citation"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-gray-700">
              {activeCitationDetail.content}
            </p>
          </div>
        )}

        {/* Source buttons */}
        {!isUser && citationEntries.length > 0 && (
          <div className="mt-3 border-t border-gray-200 pt-2">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-gray-400">
              <BookOpenIcon className="h-3.5 w-3.5" />
              <span className="font-medium">Sources:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {citationEntries.map(([key, detail]) => {
                const n = Number(key);
                const isActive = activeCitation === n;
                return (
                  <button
                    key={key}
                    onClick={() => handleCitationClick(n)}
                    className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                      isActive
                        ? "border-[var(--color-accent-green)] bg-[var(--color-accent-green)] text-white"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-[var(--color-accent-green)] hover:text-[var(--color-accent-green)]"
                    }`}
                  >
                    <span className="font-bold">{n}</span>
                    <span className="max-w-[160px] truncate">{detail.source}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-green)]">
          <UserIcon className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  );
}
