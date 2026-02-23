import { NextResponse } from "next/server";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";
import { retrieveContext, formatContext } from "@/lib/rag";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompts";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = req.headers.get("x-openai-key");
  if (!apiKey) return NextResponse.json({ error: "OpenAI API key required. Please add your key in settings." }, { status: 400 });

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
  let sourcesMap: Record<string, string> = {};
  let citationsMap: Record<string, { source: string; content: string }> = {};
  try {
    // Use a lower threshold when sources are explicitly pinned, since the user
    // has already expressed intent about which documents to search
    const threshold = selectedSources?.length ? 0.0 : 0.5;
    const docs = await retrieveContext(query, 5, threshold, selectedSources, user.id, apiKey);
    context = formatContext(docs);
    docs.forEach((doc, i) => {
      const source = doc.metadata?.source ?? doc.metadata?.title ?? `Document ${doc.id}`;
      sourcesMap[String(i + 1)] = source;
      citationsMap[String(i + 1)] = { source, content: doc.content };
    });
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

  const openai = createOpenAI({ apiKey });
  const result = streamText({
    model: openai("gpt-4o"),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: () => ({ sources: sourcesMap, citations: citationsMap }),
  });
}
