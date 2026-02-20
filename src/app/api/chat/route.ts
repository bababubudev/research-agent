import { NextResponse } from "next/server";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";
import { retrieveContext, formatContext } from "@/lib/rag";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompts";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, selectedSources }: { messages: UIMessage[]; selectedSources?: string[] } = await req.json();

  // Extract the user's latest question from parts
  const lastUserMessage = messages.findLast((m) => m.role === "user");
  const query =
    lastUserMessage?.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("") ?? "";

  // RAG: retrieve relevant context
  let context = "No relevant documents found.";
  try {
    // Use a lower threshold when sources are explicitly pinned, since the user
    // has already expressed intent about which documents to search
    const threshold = selectedSources?.length ? 0.0 : 0.5;
    const docs = await retrieveContext(query, 5, threshold, selectedSources, user.id);
    context = formatContext(docs);
  } catch {
    // If Supabase isn't configured yet, continue without context
    context = "Database not configured. Answering without document context.";
  }

  // Convert UI messages to model messages, then replace the last user message with context-augmented version
  const modelMessages = await convertToModelMessages(messages);
  const lastIdx = modelMessages.findLastIndex((m) => m.role === "user");
  if (lastIdx !== -1) {
    modelMessages[lastIdx] = {
      role: "user",
      content: buildUserPrompt(context, query),
    };
  }

  const result = streamText({
    model: openai("gpt-4o"),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
