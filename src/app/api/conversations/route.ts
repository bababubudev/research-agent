import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET /api/conversations — list all conversations (newest first)
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/conversations — create a new conversation
export async function POST(req: Request) {
  const { title } = await req.json();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("conversations")
    .insert({ title: title || "New Chat" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
