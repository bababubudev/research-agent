interface CitationBadgeProps {
  number: number;
  sourceName?: string;
  onClick?: () => void;
  active?: boolean;
}

export default function CitationBadge({ number, sourceName, onClick, active }: CitationBadgeProps) {
  return (
    <span className="group relative ml-0.5 inline-flex">
      <button
        onClick={onClick}
        title={sourceName}
        className={`inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-[10px] font-bold text-white transition-colors ${
          active
            ? "bg-[var(--color-accent-green)] ring-2 ring-[var(--color-accent-green)] ring-offset-1"
            : "bg-[var(--color-accent-green)] hover:brightness-110"
        }`}
      >
        {number}
      </button>
      {sourceName && !onClick && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          {sourceName}
        </span>
      )}
    </span>
  );
}
