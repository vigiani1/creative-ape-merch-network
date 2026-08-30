import { MediaLibraryEditor } from "@/components/media-library-editor";
import { requireSuperAdmin } from "@/lib/auth";

export default async function MediaPage() {
  const { supabase } = await requireSuperAdmin();

  const [
    { data: organizations, error: orgError },
    { data: assets, error: assetError },
  ] = await Promise.all([
    supabase.from("organizations").select("id,name,organization_number").neq("status","archived").order("name"),
    supabase.from("media_assets").select("id,organization_id,scope,media_type,title,file_name,mime_type,storage_path,alt_text,tags").order("created_at",{ ascending:false }),
  ]);

  if (orgError || assetError) throw new Error("Unable to load Media Library.");

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-black/45">Reusable assets</p>
        <h1 className="mt-1 text-3xl font-black">Media Library</h1>
        <p className="mt-2 max-w-4xl text-sm text-black/55">All reusable storefront images, videos, logos, backgrounds, and PDFs live here. Upload once, then reuse the asset in products, pages, layouts, or organization content.</p>
      </div>

      <MediaLibraryEditor
        allowMaster
        organizations={(organizations ?? []).map((org) => ({ id: org.id, name: org.name, number: Number(org.organization_number) }))}
        assets={assets ?? []}
      />
    </div>
  );
}
