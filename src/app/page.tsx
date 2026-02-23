"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import ChatInput from "@/components/ChatInput";
import AddDocumentModal from "@/components/AddDocumentModal";
import type { Conversation, DocumentSource } from "@/types";

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [documentSources, setDocumentSources] = useState<DocumentSource[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Keep ref in sync
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Persist messages when assistant finishes streaming
  const handleFinish = useCallback(async () => {
    const cid = conversationIdRef.current;
    if (!cid) return;

    // Get current messages from the chat (via ref)
    const msgs = messagesRef.current;
    if (msgs.length === 0) return;

    await fetch(`/api/conversations/${cid}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs }),
    });

    // Refresh conversation list to update timestamps/order
    loadConversations();
  }, []);

  const selectedSourcesRef = useRef<string[]>(selectedSources);
  useEffect(() => {
    selectedSourcesRef.current = selectedSources;
  }, [selectedSources]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => {
          const sources = selectedSourcesRef.current;
          return sources.length > 0 ? { selectedSources: sources } : {};
        },
      }),
    []
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    onFinish: handleFinish,
  });

  // Keep a ref to messages for use in onFinish closure
  const messagesRef = useRef<UIMessage[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const [input, setInput] = useState("");
  const isLoading = status === "submitted" || status === "streaming";

  // Load conversations and document sources on mount
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      // silently ignore — Supabase may not be configured
    }
  }, []);

  const loadDocumentSources = useCallback(async () => {
    try {
      const res = await fetch("/api/documents/sources");
      if (res.ok) {
        const data = await res.json();
        setDocumentSources(data);
      }
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadDocumentSources();
  }, [loadConversations, loadDocumentSources]);

  // Fetch current user on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  // New chat
  function handleNewChat() {
    setConversationId(null);
    setMessages([]);
    setInput("");
  }

  // Select existing conversation
  async function handleSelectConversation(id: string) {
    if (id === conversationId) return;

    setConversationId(id);
    setInput("");

    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        // Convert DB rows back to UIMessage shape
        const uiMessages: UIMessage[] = data.map(
          (m: { id: string; role: "user" | "assistant"; parts: UIMessage["parts"]; metadata?: unknown; created_at: string }) => ({
            id: m.id,
            role: m.role,
            parts: m.parts,
            metadata: m.metadata ?? undefined,
            createdAt: new Date(m.created_at),
          })
        );
        setMessages(uiMessages);
      }
    } catch {
      // silently ignore
    }
  }

  // Delete conversation
  async function handleDeleteConversation(id: string) {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });

    // If deleting the active conversation, clear the chat
    if (id === conversationId) {
      setConversationId(null);
      setMessages([]);
    }

    loadConversations();
  }

  // Delete document source
  async function handleDeleteDocumentSource(source: string) {
    await fetch(`/api/documents/sources?source=${encodeURIComponent(source)}`, {
      method: "DELETE",
    });
    loadDocumentSources();
  }

  function handleSuggestionClick(query: string) {
    setInput(query);
  }

  function handleToggleDocumentSource(source: string) {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  }

  function handleRemoveSource(source: string) {
    setSelectedSources((prev) => prev.filter((s) => s !== source));
  }

  // Submit message — create conversation on first message
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const text = input;
    setInput("");

    // If no active conversation, create one first
    if (!conversationId) {
      try {
        const title = text.length > 80 ? text.slice(0, 80) + "..." : text;
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (res.ok) {
          const conv = await res.json();
          setConversationId(conv.id);
          // Update ref immediately so onFinish can use it
          conversationIdRef.current = conv.id;
          loadConversations();
        }
      } catch {
        // If conversation creation fails, still send the message (just won't persist)
      }
    }

    sendMessage({ text });
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        conversations={conversations}
        activeConversationId={conversationId}
        documentSources={documentSources}
        selectedSources={selectedSources}
        userEmail={userEmail}
        onNewChat={handleNewChat}
        onAddDocument={() => setShowUploadModal(true)}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onDeleteDocumentSource={handleDeleteDocumentSource}
        onToggleDocumentSource={handleToggleDocumentSource}
      />

      <main className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-white px-6 py-3">
          <h1 className="text-lg font-semibold text-gray-900">
            Documentation Search
          </h1>
          <div className="flex items-center gap-3">
            {userEmail && (
              <>
                <span className="text-sm text-gray-500">{userEmail}</span>
                <form action="/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </form>
              </>
            )}
          </div>
        </header>

        <ChatArea
          messages={messages}
          isLoading={isLoading}
          onSuggestionClick={handleSuggestionClick}
        />

        <ChatInput
          input={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          selectedSources={selectedSources}
          onRemoveSource={handleRemoveSource}
        />
      </main>

      <AddDocumentModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={loadDocumentSources}
      />
    </div>
  );
}
