import { NextResponse } from "next/server";
import { streamText, tool, zodSchema, stepCountIs, UIMessage, convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { retrieveContext } from "@/lib/rag";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import type { MatchedDocument, CitationDetail } from "@/types";

// ---------------------------------------------------------------------------
// Calculator — Pratt parser (no eval / Function constructor)
// Supports: + - * / ** ^, (), constants pi e, functions sqrt log sin cos tan abs
// ---------------------------------------------------------------------------

type TokenType = "number" | "ident" | "op" | "lparen" | "rparen" | "eof";
interface Token { type: TokenType; value: string }

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let num = "";
      while (i < expr.length && /[0-9.]/.test(expr[i])) num += expr[i++];
      tokens.push({ type: "number", value: num });
    } else if (/[a-zA-Z_]/.test(ch)) {
      let id = "";
      while (i < expr.length && /[a-zA-Z_0-9]/.test(expr[i])) id += expr[i++];
      tokens.push({ type: "ident", value: id });
    } else if (ch === "*" && expr[i + 1] === "*") {
      tokens.push({ type: "op", value: "**" }); i += 2;
    } else if ("+-*/^".includes(ch)) {
      tokens.push({ type: "op", value: ch }); i++;
    } else if (ch === "(") { tokens.push({ type: "lparen", value: "(" }); i++; }
    else if (ch === ")") { tokens.push({ type: "rparen", value: ")" }); i++; }
    else { i++; } // skip unknown
  }
  tokens.push({ type: "eof", value: "" });
  return tokens;
}

const PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "**": 3, "^": 3 };

function parseExpr(tokens: Token[], pos: { i: number }, minPrec = 0): number {
  let left = parsePrimary(tokens, pos);
  while (true) {
    const tok = tokens[pos.i];
    if (tok.type !== "op") break;
    const prec = PREC[tok.value] ?? -1;
    if (prec <= minPrec) break;
    pos.i++;
    // right-associative for ** and ^
    const rightPrec = (tok.value === "**" || tok.value === "^") ? prec - 1 : prec;
    const right = parseExpr(tokens, pos, rightPrec);
    switch (tok.value) {
      case "+": left += right; break;
      case "-": left -= right; break;
      case "*": left *= right; break;
      case "/": left /= right; break;
      case "**": case "^": left = Math.pow(left, right); break;
    }
  }
  return left;
}

function parsePrimary(tokens: Token[], pos: { i: number }): number {
  const tok = tokens[pos.i];
  if (tok.type === "number") { pos.i++; return parseFloat(tok.value); }
  if (tok.type === "op" && tok.value === "-") {
    pos.i++; return -parsePrimary(tokens, pos);
  }
  if (tok.type === "lparen") {
    pos.i++;
    const val = parseExpr(tokens, pos, 0);
    if (tokens[pos.i].type === "rparen") pos.i++;
    return val;
  }
  if (tok.type === "ident") {
    pos.i++;
    const name = tok.value.toLowerCase();
    const consts: Record<string, number> = { pi: Math.PI, e: Math.E };
    if (name in consts) return consts[name];
    // function call
    if (tokens[pos.i].type === "lparen") {
      pos.i++;
      const arg = parseExpr(tokens, pos, 0);
      if (tokens[pos.i].type === "rparen") pos.i++;
      const fns: Record<string, (x: number) => number> = {
        sqrt: Math.sqrt, log: Math.log, sin: Math.sin,
        cos: Math.cos, tan: Math.tan, abs: Math.abs,
      };
      if (name in fns) return fns[name](arg);
    }
    return NaN;
  }
  return NaN;
}

function calculate(expression: string): number {
  const tokens = tokenize(expression);
  return parseExpr(tokens, { i: 0 }, 0);
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = req.headers.get("x-openai-key");
  if (!apiKey) return NextResponse.json({ error: "OpenAI API key required. Please add your key in settings." }, { status: 400 });

  const { messages, selectedSources }: { messages: UIMessage[]; selectedSources?: string[] } = await req.json();

  const modelMessages = await convertToModelMessages(messages);

  // Accumulator — populated by searchDocuments.execute(), read by messageMetadata
  const allDocs: MatchedDocument[] = [];

  const openai = createOpenAI({ apiKey });

  const searchDocumentsTool = tool({
    description: "Search the documentation knowledge base for information relevant to the query.",
    inputSchema: zodSchema(
      z.object({
        query: z.string().describe("The search query to find relevant documentation"),
        matchCount: z.number().int().min(1).max(10).optional().describe("Number of results to return (default 5)"),
      })
    ),
    execute: async ({ query: searchQuery, matchCount = 5 }) => {
      const offset = allDocs.length;
      try {
        const threshold = selectedSources?.length ? 0.0 : 0.5;
        const docs = await retrieveContext(searchQuery, matchCount, threshold, selectedSources, user.id, apiKey);
        allDocs.push(...docs);
        if (docs.length === 0) return "No relevant documents found for this query.";
        return docs
          .map((doc, i) => {
            const n = offset + i + 1;
            const source = doc.metadata?.source ?? doc.metadata?.title ?? `Document ${doc.id}`;
            return `[${n}] (Source: ${source})\n${doc.content}`;
          })
          .join("\n\n---\n\n");
      } catch {
        return "Database not configured or unavailable. Cannot search documents.";
      }
    },
  });

  const calculatorTool = tool({
    description: "Evaluate a mathematical expression. Supports +, -, *, /, ** (power), parentheses, and functions: sqrt, log, sin, cos, tan, abs. Constants: pi, e.",
    inputSchema: zodSchema(
      z.object({
        expression: z.string().describe("The mathematical expression to evaluate, e.g. 'sqrt(144) * pi'"),
      })
    ),
    execute: async ({ expression }) => {
      const result = calculate(expression);
      if (isNaN(result)) return `Could not evaluate expression: ${expression}`;
      return `${expression} = ${result}`;
    },
  });

  const result = streamText({
    model: openai("gpt-4o"),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools: { searchDocuments: searchDocumentsTool, calculator: calculatorTool },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: () => {
      if (allDocs.length === 0) return undefined;
      const sources: Record<string, string> = {};
      const citations: Record<string, CitationDetail> = {};
      allDocs.forEach((doc, i) => {
        const key = String(i + 1);
        const src = doc.metadata?.source ?? doc.metadata?.title ?? `Document ${doc.id}`;
        sources[key] = src;
        citations[key] = { source: src, content: doc.content };
      });
      return { sources, citations };
    },
  });
}
