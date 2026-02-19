interface SuggestionChipProps {
  title: string;
  description: string;
  onClick: (query: string) => void;
}

export default function SuggestionChip({
  title,
  description,
  onClick,
}: SuggestionChipProps) {
  return (
    <button
      onClick={() => onClick(title)}
      className="rounded-xl border border-[var(--color-border-subtle)] bg-white p-5 text-left transition-shadow hover:shadow-md"
    >
      <h3 className="mb-2 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-500">{description}</p>
    </button>
  );
}
