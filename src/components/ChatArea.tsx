"use client";

import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import WelcomeScreen from "./WelcomeScreen";
import type { UIMessage } from "ai";

interface ChatAreaProps {
  messages: UIMessage[];
  isLoading: boolean;
  onSuggestionClick: (query: string) => void;
}

export default function ChatArea({
  messages,
  isLoading,
  onSuggestionClick,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return <WelcomeScreen onSuggestionClick={onSuggestionClick} />;
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-sidebar)]">
              <span className="h-4 w-4 animate-pulse rounded-full bg-[var(--color-accent-green)]" />
            </div>
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-white px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-300 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-300 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-300 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
