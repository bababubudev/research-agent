interface CitationBadgeProps {
  number: number;
}

export default function CitationBadge({ number }: CitationBadgeProps) {
  return (
    <span className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent-green)] text-[10px] font-bold text-white">
      {number}
    </span>
  );
}
