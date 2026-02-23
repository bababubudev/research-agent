import {
  MagnifyingGlassIcon,
  BookOpenIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  LockClosedIcon,
  CodeBracketIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType } from "react";
import SuggestionChip from "./SuggestionChip";
import type { DocumentSource } from "@/types";

type IconComponent = ComponentType<{ className?: string }>;

const DEFAULT_SUGGESTIONS: { title: string; description: string; query: string; icon: IconComponent }[] = [
  {
    title: "How authentication works",
    description: "Explain the auth flow and session management.",
    query: "Can you explain how authentication works? Please cover the full flow including tokens, sessions, and any relevant security considerations.",
    icon: LockClosedIcon,
  },
  {
    title: "Available API endpoints",
    description: "List routes, methods, and expected payloads.",
    query: "What API endpoints are available? Please list each route, its HTTP method, expected request payload, and what it returns.",
    icon: CodeBracketIcon,
  },
  {
    title: "Deployment steps",
    description: "Environment setup and hosting options.",
    query: "What are the steps to deploy this application? Please walk me through environment setup, configuration, and available hosting options.",
    icon: CloudArrowUpIcon,
  },
];

const TEMPLATE_ICONS: IconComponent[] = [BookOpenIcon, LightBulbIcon, RocketLaunchIcon];

const SUGGESTION_TEMPLATES = [
  (name: string) => ({
    title: `${name} overview`,
    description: `Summarize what ${name} covers.`,
    query: `Give me a comprehensive overview of ${name}. What are the main topics it covers and how is it structured?`,
    icon: TEMPLATE_ICONS[0],
  }),
  (name: string) => ({
    title: `Key concepts: ${name}`,
    description: `Important terms and concepts from ${name}.`,
    query: `What are the key concepts and important terminology I should understand from ${name}? Please explain each one clearly.`,
    icon: TEMPLATE_ICONS[1],
  }),
  (name: string) => ({
    title: `Get started with ${name}`,
    description: `How to get started using ${name}.`,
    query: `How do I get started with ${name}? Walk me through the initial setup and the first steps I should take.`,
    icon: TEMPLATE_ICONS[2],
  }),
];

function formatSourceName(source: string): string {
  return source
    .replace(/\.[^.]+$/, "")  // strip extension
    .replace(/[-_]/g, " ")    // separators → spaces
    .trim();
}

interface WelcomeScreenProps {
  documentSources: DocumentSource[];
  onSuggestionClick: (query: string, source?: string) => void;
}

export default function WelcomeScreen({
  documentSources,
  onSuggestionClick,
}: WelcomeScreenProps) {
  const suggestions =
    documentSources.length > 0
      ? Array.from({ length: 3 }, (_, i) => {
          const { source } = documentSources[i % documentSources.length];
          const name = formatSourceName(source);
          return { ...SUGGESTION_TEMPLATES[i](name), source };
        })
      : DEFAULT_SUGGESTIONS;

  return (
    <div className="flex flex-col items-center">
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
            query={s.query}
            source={"source" in s ? (s.source as string) : undefined}
            icon={s.icon}
            onClick={onSuggestionClick}
          />
        ))}
      </div>
    </div>
  );
}
