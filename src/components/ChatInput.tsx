"use client";

import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { type FormEvent } from "react";

interface ChatInputProps {
  input: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
}

export default function ChatInput({
  input,
  onChange,
  onSubmit,
  isLoading,
}: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="border-t border-[var(--color-border-subtle)] bg-white px-6 py-4">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask a question about your documentation..."
          className="flex-1 rounded-xl border border-[var(--color-border-subtle)] bg-[#F5F5F5] px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[var(--color-accent-green)] focus:ring-1 focus:ring-[var(--color-accent-green)]"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-accent-green)] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}
