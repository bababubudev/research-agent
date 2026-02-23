"use client";

import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import type { UIMessage } from "ai";

interface ChatAreaProps {
  messages: UIMessage[];
  isLoading: boolean;
  error?: Error;
}

export default function ChatArea({
  messages,
  isLoading,
  error,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {/401|incorrect api key|invalid api key/i.test(error.message)
              ? "Invalid API key — please check your key in settings."
              : error.message || "Something went wrong. Please try again."}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
