"use client";

import { PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { type FormEvent } from "react";

interface ChatInputProps {
  input: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  selectedSources: string[];
  onRemoveSource: (source: string) => void;
  borderless?: boolean;
}

export default function ChatInput({
  input,
  onChange,
  onSubmit,
  isLoading,
  selectedSources,
  onRemoveSource,
  borderless = false,
}: ChatInputProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={borderless ? "px-0 py-0" : "border-t border-[var(--color-border-subtle)] bg-white px-6 py-4"}
    >
      <div className={borderless ? "w-full" : "mx-auto max-w-3xl"}>
        {/* Selected source chips */}
        {selectedSources.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {selectedSources.map((source) => (
              <span
                key={source}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-green)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-accent-green)]"
              >
                {source}
                <button
                  type="button"
                  onClick={() => onRemoveSource(source)}
                  className="rounded-full p-0.5 hover:bg-[var(--color-accent-green)]/20"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
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
      </div>
    </form>
  );
}
