import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  const { supabase } = await requireSuperAdmin();
  const body = await request.json() as { id?: string; storagePath?: string };

  if (!body.id || !body.storagePath) {
    return NextResponse.json({ error: "Missing media reference." }, { status: 400 });
  }

  const { error } = await supabase.from("media_assets").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.storage.from("media-library").remove([body.storagePath]);
  return NextResponse.json({ ok: true });
}
