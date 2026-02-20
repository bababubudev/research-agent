"use client";

import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { Conversation, DocumentSource } from "@/types";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  documentSources: DocumentSource[];
  onNewChat: () => void;
  onAddDocument: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onDeleteDocumentSource: (source: string) => void;
}

export default function Sidebar({
  conversations,
  activeConversationId,
  documentSources,
  onNewChat,
  onAddDocument,
  onSelectConversation,
  onDeleteConversation,
  onDeleteDocumentSource,
}: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col bg-[var(--color-sidebar)] p-4">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2 px-2">
        <BookOpenIcon className="h-7 w-7 text-[var(--color-accent-green)]" />
        <span className="text-lg font-semibold text-[var(--color-accent-green)]">
          Research Agent
        </span>
      </div>

      {/* Scrollable nav area */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {/* Chat History Section */}
        <div className="mb-3 px-2 text-xs font-medium uppercase tracking-wider text-gray-500">
          Chat History
        </div>

        {conversations.length === 0 && (
          <p className="px-3 py-2 text-xs text-gray-400">No conversations yet</p>
        )}

        {conversations.map((conv) => {
          const isActive = conv.id === activeConversationId;
          return (
            <div
              key={conv.id}
              className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-[var(--color-sidebar-active)] font-medium text-white"
                  : "text-gray-700 hover:bg-white/50"
              }`}
            >
              <button
                onClick={() => onSelectConversation(conv.id)}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <ChatBubbleLeftRightIcon
                  className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-gray-400"}`}
                />
                <span className="truncate">{conv.title}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
                className={`shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 ${
                  isActive
                    ? "text-white/70 hover:text-white"
                    : "text-gray-400 hover:text-red-500"
                }`}
                title="Delete conversation"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}

        {/* Knowledge Base Section */}
        <div className="mb-3 mt-6 px-2 text-xs font-medium uppercase tracking-wider text-gray-500">
          Knowledge Base
        </div>

        {documentSources.length === 0 && (
          <p className="px-3 py-2 text-xs text-gray-400">No documents yet</p>
        )}

        {documentSources.map((doc) => (
          <div
            key={doc.source}
            className="group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-700"
          >
            <DocumentTextIcon className="h-5 w-5 shrink-0 text-gray-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate">{doc.source}</p>
              <p className="text-xs text-gray-400">
                {doc.chunk_count} chunk{doc.chunk_count !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => onDeleteDocumentSource(doc.source)}
              className="shrink-0 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
              title="Delete document"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </nav>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={onAddDocument}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-accent-green)] px-4 py-2.5 text-sm font-medium text-[var(--color-accent-green)] transition-colors hover:bg-[var(--color-accent-green)]/10"
        >
          <DocumentPlusIcon className="h-5 w-5" />
          Add Document
        </button>
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent-green)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          <PlusIcon className="h-5 w-5" />
          New Chat
        </button>
      </div>
    </aside>
  );
}
