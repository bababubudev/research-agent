import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET /api/conversations/[id]/messages — load messages for a conversation
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/conversations/[id]/messages — upsert messages (idempotent)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { messages } = await req.json();
  const supabase = getSupabase();

  // Map UIMessages to DB rows
  const rows = messages.map(
    (m: { id: string; role: string; parts: unknown }) => ({
      id: m.id,
      conversation_id: id,
      role: m.role,
      parts: m.parts,
    })
  );

  const { error } = await supabase
    .from("messages")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
