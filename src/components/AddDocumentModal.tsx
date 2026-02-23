"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  XMarkIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

type Tab = "text" | "file" | "url";

interface AddDocumentModalProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
  apiKey?: string;
}

export default function AddDocumentModal({
  open,
  onClose,
  onUploadSuccess,
  apiKey,
}: AddDocumentModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("text");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [existingSources, setExistingSources] = useState<string[]>([]);

  // Text tab state
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteContent, setPasteContent] = useState("");

  // File tab state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL tab state
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/documents/sources")
      .then((r) => r.json())
      .then((data: { source: string }[]) =>
        setExistingSources(Array.isArray(data) ? data.map((d) => d.source) : [])
      )
      .catch(() => {});
  }, [open]);

  const pendingSource =
    activeTab === "file"
      ? (selectedFile?.name ?? "")
      : activeTab === "text"
        ? (pasteTitle.trim() || "Pasted text")
        : url.trim();

  const isDuplicate =
    pendingSource.length > 0 && existingSources.includes(pendingSource);

  function resetForm() {
    setPasteTitle("");
    setPasteContent("");
    setSelectedFile(null);
    setUrl("");
    setFeedback(null);
  }

  function handleClose() {
    if (loading) return;
    resetForm();
    onClose();
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  }, []);

  async function handleSubmit() {
    setLoading(true);
    setFeedback(null);

    try {
      const formData = new FormData();

      if (activeTab === "text") {
        if (!pasteContent.trim()) throw new Error("Please enter some text.");
        formData.append("text", pasteContent);
        if (pasteTitle.trim()) formData.append("title", pasteTitle);
      } else if (activeTab === "file") {
        if (!selectedFile) throw new Error("Please select a file.");
        formData.append("file", selectedFile);
      } else {
        if (!url.trim()) throw new Error("Please enter a URL.");
        formData.append("url", url);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: apiKey ? { "x-openai-key": apiKey } : {},
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed.");

      setFeedback({
        type: "success",
        message: data.replaced
          ? `Replaced "${data.source}" with ${data.chunksStored} updated chunks.`
          : `Ingested ${data.chunksStored} chunks from "${data.source}".`,
      });
      onUploadSuccess?.();
      // Reset input fields after success
      setPasteTitle("");
      setPasteContent("");
      setSelectedFile(null);
      setUrl("");
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const tabs: { key: Tab; label: string; icon: typeof DocumentTextIcon }[] = [
    { key: "text", label: "Paste Text", icon: DocumentTextIcon },
    { key: "file", label: "Upload File", icon: ArrowUpTrayIcon },
    { key: "url", label: "From URL", icon: GlobeAltIcon },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Add Document
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border-subtle)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setFeedback(null);
              }}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-[var(--color-accent-green)] text-[var(--color-accent-green)]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Text Tab */}
          {activeTab === "text" && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Title (optional)"
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-accent-green)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-green)]"
              />
              <textarea
                placeholder="Paste your document text here..."
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                rows={6}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-accent-green)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-green)]"
              />
            </div>
          )}

          {/* File Tab */}
          {activeTab === "file" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors ${
                dragOver
                  ? "border-[var(--color-accent-green)] bg-green-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <ArrowUpTrayIcon className="mb-2 h-8 w-8 text-gray-400" />
              {selectedFile ? (
                <p className="text-sm font-medium text-gray-700">
                  {selectedFile.name}{" "}
                  <span className="text-gray-400">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">
                    Drop a file here or click to browse
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Supports .txt, .md, .pdf (max 10 MB)
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          {/* URL Tab */}
          {activeTab === "url" && (
            <input
              type="url"
              placeholder="https://example.com/docs/page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-accent-green)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-green)]"
            />
          )}

          {/* Duplicate warning */}
          {isDuplicate && !feedback && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <span className="font-medium">"{pendingSource}"</span> already
                exists. Uploading will replace it.
              </span>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div
              className={`mt-4 flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                feedback.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              {feedback.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-[var(--color-border-subtle)] px-6 py-4">
          <button
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-accent-green)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {loading && (
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
