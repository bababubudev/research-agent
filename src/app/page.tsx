"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import ChatInput from "@/components/ChatInput";

export default function Home() {
  const { messages, sendMessage, status, setMessages } = useChat();
  const [input, setInput] = useState("");

  const isLoading = status === "submitted" || status === "streaming";

  function handleNewChat() {
    setMessages([]);
    setInput("");
  }

  function handleSuggestionClick(query: string) {
    setInput(query);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar onNewChat={handleNewChat} />

      <main className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-white px-6 py-3">
          <h1 className="text-lg font-semibold text-gray-900">
            Documentation Search
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[var(--color-accent-green)]" />
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
        />
      </main>
    </div>
  );
}
