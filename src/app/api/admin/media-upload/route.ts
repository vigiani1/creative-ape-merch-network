import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

function safeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const { supabase, userId } = await requireUser();
  const formData = await request.formData();
  const file = formData.get("file");
  const scope = String(formData.get("scope") ?? "organization");
  const organizationId = String(formData.get("organizationId") ?? "");

  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only image files are supported here." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Image must be 10 MB or smaller." }, { status: 400 });

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("platform_role").eq("id", userId).maybeSingle(),
    supabase.from("organization_members").select("organization_id,role").eq("user_id", userId),
  ]);

  const isSuperAdmin = profile?.platform_role === "super_admin";
  const memberOrgIds = new Set((memberships ?? []).map((membership) => membership.organization_id));

  if (scope === "master" && !isSuperAdmin) {
    return NextResponse.json({ error: "Master Library uploads require platform administrator access." }, { status: 403 });
  }

  if (scope !== "master" && (!organizationId || (!isSuperAdmin && !memberOrgIds.has(organizationId)))) {
    return NextResponse.json({ error: "You do not have access to that organization library." }, { status: 403 });
  }

  const folder = scope === "master" ? "master" : organizationId;
  const storagePath = `${folder}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("media-library")
    .upload(storagePath, bytes, { contentType: file.type, cacheControl: "3600", upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

  const { data: asset, error: assetError } = await supabase
    .from("media_assets")
    .insert({
      organization_id: scope === "master" ? null : organizationId,
      scope: scope === "master" ? "master" : "organization",
      media_type: "image",
      title: file.name.replace(/\.[^.]+$/, ""),
      file_name: file.name,
      mime_type: file.type,
      bucket_name: "media-library",
      storage_path: storagePath,
      alt_text: file.name.replace(/\.[^.]+$/, ""),
      tags: [],
      is_public: true,
    })
    .select("id,storage_path")
    .single();

  if (assetError || !asset) {
    await supabase.storage.from("media-library").remove([storagePath]);
    return NextResponse.json({ error: assetError?.message || "Unable to save media." }, { status: 400 });
  }

  const publicUrl = supabase.storage.from("media-library").getPublicUrl(storagePath).data.publicUrl;
  return NextResponse.json({ assetId: asset.id, url: publicUrl });
}
