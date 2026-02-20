import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ingestDocument } from "@/lib/rag";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, metadata } = await req.json();

  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "Request body must include a `content` string." },
      { status: 400 }
    );
  }

  const result = await ingestDocument(content, metadata ?? {}, user.id);
  return NextResponse.json(result);
}
