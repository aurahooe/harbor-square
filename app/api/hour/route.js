import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data: hour, error } = await supabase.rpc("rotate_hourly_pulse");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let featured = null;
  if (hour?.featured_note_id) {
    const { data } = await supabase
      .from("notes")
      .select("id,title,body,is_public,created_at")
      .eq("id", hour.featured_note_id)
      .maybeSingle();
    featured = data;
  }
  return NextResponse.json({ hour, featured });
}

export async function POST() {
  return GET();
}
