"use client";

import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  onNewChat: () => void;
}

const navItems = [
  { icon: ClockIcon, label: "Recent Chat 1" },
  { icon: ClockIcon, label: "Recent Chat 2" },
  { icon: ClockIcon, label: "Recent Chat 3" },
];

export default function Sidebar({ onNewChat }: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col bg-[var(--color-sidebar)] p-4">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2 px-2">
        <BookOpenIcon className="h-7 w-7 text-[var(--color-accent-green)]" />
        <span className="text-lg font-semibold text-[var(--color-accent-green)]">
          Research Agent
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        <div className="mb-3 px-2 text-xs font-medium uppercase tracking-wider text-gray-500">
          Chat History
        </div>
        {/* Active item */}
        <a
          href="#"
          className="flex items-center gap-3 rounded-lg bg-[var(--color-sidebar-active)] px-3 py-2.5 text-sm font-medium text-white"
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
          Current Chat
        </a>
        {/* Static placeholder items */}
        {navItems.map((item) => (
          <a
            key={item.label}
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-white/50"
          >
            <item.icon className="h-5 w-5 text-gray-400" />
            {item.label}
          </a>
        ))}
      </nav>

      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-accent-green)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
      >
        <PlusIcon className="h-5 w-5" />
        New Chat
      </button>
    </aside>
  );
}
