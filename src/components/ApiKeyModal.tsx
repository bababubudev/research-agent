"use client";

import { useState } from "react";
import { XMarkIcon, KeyIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

interface ApiKeyModalProps {
  currentKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
}

export default function ApiKeyModal({ currentKey, onSave, onClose }: ApiKeyModalProps) {
  const [value, setValue] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);

  function handleSave() {
    onSave(value.trim());
    onClose();
  }

  function handleClear() {
    setValue("");
    onSave("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-6 py-4">
          <div className="flex items-center gap-2">
            <KeyIcon className="h-5 w-5 text-[var(--color-accent-green)]" />
            <h2 className="text-lg font-semibold text-gray-900">OpenAI API Key</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            Your key is stored only in your browser and sent directly to the server for each request. It is never saved to a database.
          </p>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="sk-..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-accent-green)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-green)]"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
            >
              {showKey ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Get your key at{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent-green)] hover:underline"
            >
              platform.openai.com/api-keys
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-between border-t border-[var(--color-border-subtle)] px-6 py-4">
          {currentKey ? (
            <button
              onClick={handleClear}
              className="rounded-lg px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              Remove Key
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!value.trim()}
              className="rounded-lg bg-[var(--color-accent-green)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
