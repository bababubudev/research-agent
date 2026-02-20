import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET /api/documents/sources — list document sources with chunk counts
export async function GET() {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("list_document_sources");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/documents/sources?source=... — delete all chunks for a source
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source");

  if (!source) {
    return NextResponse.json(
      { error: "Missing 'source' query parameter" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  const { error } = await supabase.rpc("delete_documents_by_source", {
    target_source: source,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
