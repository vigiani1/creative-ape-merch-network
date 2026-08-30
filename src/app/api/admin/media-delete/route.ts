import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  const { supabase, userId } = await requireUser();
  const body = await request.json() as { id?: string; storagePath?: string };

  if (!body.id || !body.storagePath) return NextResponse.json({ error: "Missing media reference." }, { status: 400 });

  const { data: asset, error: assetLookupError } = await supabase
    .from("media_assets")
    .select("id,organization_id,scope,storage_path")
    .eq("id", body.id)
    .maybeSingle();

  if (assetLookupError || !asset) return NextResponse.json({ error: "Media not found." }, { status: 404 });

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("platform_role").eq("id", userId).maybeSingle(),
    supabase.from("organization_members").select("organization_id").eq("user_id", userId),
  ]);

  const isSuperAdmin = profile?.platform_role === "super_admin";
  const memberOrgIds = new Set((memberships ?? []).map((membership) => membership.organization_id));

  if (asset.scope === "master" && !isSuperAdmin) {
    return NextResponse.json({ error: "Master Library media can only be removed by a platform administrator." }, { status: 403 });
  }

  if (asset.scope !== "master" && !isSuperAdmin && (!asset.organization_id || !memberOrgIds.has(asset.organization_id))) {
    return NextResponse.json({ error: "You do not have access to remove this media." }, { status: 403 });
  }

  const { error } = await supabase.from("media_assets").delete().eq("id", asset.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.storage.from("media-library").remove([asset.storage_path]);
  return NextResponse.json({ ok: true });
}
