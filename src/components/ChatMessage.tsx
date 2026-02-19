"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CitationBadge from "./CitationBadge";
import { UserIcon } from "@heroicons/react/24/solid";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import type { UIMessage } from "ai";

interface ChatMessageProps {
  message: UIMessage;
}

/** Replace [1], [2] etc. in text with citation badge components. */
function renderContentWithCitations(text: string) {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (match) {
      return <CitationBadge key={i} number={parseInt(match[1], 10)} />;
    }
    return (
      <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
        {part}
      </ReactMarkdown>
    );
  });
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  // Extract text content from the message parts
  const textContent = message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-sidebar)]">
          <BookOpenIcon className="h-4 w-4 text-[var(--color-accent-green)]" />
        </div>
      )}

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[var(--color-accent-green)] text-white"
            : "border border-[var(--color-border-subtle)] bg-white text-gray-800"
        }`}
      >
        {isUser ? (
          <p className="text-sm">{textContent}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0">
            {renderContentWithCitations(textContent)}
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
