"use client";

import React, { Children, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CitationBadge from "./CitationBadge";
import { UserIcon } from "@heroicons/react/24/solid";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import type { UIMessage } from "ai";

interface ChatMessageProps {
  message: UIMessage;
}

/** Replace [N] patterns in React text children with CitationBadge components. */
function replaceCitations(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child !== "string") return child;
    const parts = child.split(/(\[\d+\])/g);
    if (parts.length === 1) return child;
    return parts
      .filter(Boolean)
      .map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/);
        return m ? (
          <CitationBadge key={i} number={parseInt(m[1], 10)} />
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        );
      });
  });
}

/** ReactMarkdown component overrides that inject citation badges into text. */
const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => (
    <p>{replaceCitations(children)}</p>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li>{replaceCitations(children)}</li>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong>{replaceCitations(children)}</strong>
  ),
  em: ({ children }: { children?: ReactNode }) => (
    <em>{replaceCitations(children)}</em>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td>{replaceCitations(children)}</td>
  ),
  pre: ({ children }: { children?: ReactNode }) => (
    <pre className="overflow-x-auto">{children}</pre>
  ),
};

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
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-green)]">
          <UserIcon className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  );
}
