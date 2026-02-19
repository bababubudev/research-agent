import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import SuggestionChip from "./SuggestionChip";

const suggestions = [
  {
    title: "How does authentication work?",
    description:
      "Explain the authentication flow, including tokens and session management.",
  },
  {
    title: "What are the API endpoints?",
    description:
      "List available API routes, their methods, and expected payloads.",
  },
  {
    title: "How to deploy the application?",
    description:
      "Walk through the deployment process, environment setup, and hosting options.",
  },
];

interface WelcomeScreenProps {
  onSuggestionClick: (query: string) => void;
}

export default function WelcomeScreen({
  onSuggestionClick,
}: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-sidebar)]">
        <MagnifyingGlassIcon className="h-8 w-8 text-[var(--color-accent-green)]" />
      </div>
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">
        What can I help you find?
      </h1>
      <p className="mb-10 max-w-md text-center text-sm text-gray-500">
        Ask questions about your documentation. Answers are grounded in your
        uploaded sources with cited references.
      </p>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        {suggestions.map((s) => (
          <SuggestionChip
            key={s.title}
            title={s.title}
            description={s.description}
            onClick={onSuggestionClick}
          />
        ))}
      </div>
    </div>
  );
}
