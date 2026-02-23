import { ArrowRightIcon } from "@heroicons/react/24/outline";
import type { ComponentType } from "react";
import type React from "react";

interface SuggestionChipProps {
  title: string;
  description: string;
  query: string;
  source?: string;
  icon: ComponentType<{ className?: string; style?: React.CSSProperties; "aria-hidden"?: string }>;
  onClick: (query: string, source?: string) => void;
}

export default function SuggestionChip({
  title,
  description,
  query,
  source,
  icon: Icon,
  onClick,
}: SuggestionChipProps) {
  return (
    <button
      onClick={() => onClick(query, source)}
      className="group relative grid grid-rows-[2.5rem_1fr_auto] overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-gray-50 p-5 text-left transition-all hover:border-[var(--color-accent-green)]/50 hover:shadow-md"
    >
      {/* Inset background icon — anchored right, partially clipped, very faint */}
      <Icon
        className="pointer-events-none absolute -right-4 top-1/2 h-20 w-20 -translate-y-1/2"
        style={{ opacity: 0.1 }}
        aria-hidden="true"
      />

      {/* Row 1: fixed 2.5rem — title always occupies the same vertical space */}
      <h3 className="relative self-start pr-12 text-sm font-semibold text-gray-900">{title}</h3>
      {/* Row 2: stretches to fill remaining space */}
      <p className="relative pr-12 pt-1.5 text-xs leading-relaxed text-gray-600">{description}</p>
      {/* Row 3: arrow */}
      <div className="relative mt-4 flex justify-end">
        <ArrowRightIcon className="h-4 w-4 text-gray-300 transition-colors group-hover:text-[var(--color-accent-green)]" />
      </div>
    </button>
  );
}
