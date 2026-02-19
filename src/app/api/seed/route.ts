import { NextResponse } from "next/server";
import { ingestDocument } from "@/lib/rag";

export async function POST(req: Request) {
  const { content, metadata } = await req.json();

  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "Request body must include a `content` string." },
      { status: 400 }
    );
  }

  const result = await ingestDocument(content, metadata ?? {});
  return NextResponse.json(result);
}
