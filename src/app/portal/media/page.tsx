import { MediaLibraryEditor } from "@/components/media-library-editor";
import { requireOrganizationMembership } from "@/lib/auth";

export default async function PortalMediaPage() {
  const { supabase, organizationIds } = await requireOrganizationMembership();

  const [
    { data: organizations, error: orgError },
    { data: assets, error: assetError },
  ] = await Promise.all([
    supabase.from("organizations").select("id,name,organization_number").in("id", organizationIds).order("name"),
    supabase.from("media_assets").select("id,organization_id,scope,media_type,title,file_name,mime_type,storage_path,alt_text,tags").in("organization_id", organizationIds).order("created_at",{ ascending:false }),
  ]);

  if (orgError || assetError) throw new Error("Unable to load organization media.");

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-black/45">Organization assets</p>
        <h1 className="mt-1 text-3xl font-black">Media Library</h1>
        <p className="mt-2 max-w-3xl text-sm text-black/55">Upload and reuse images, videos, and files for your organization storefront. Creative Ape master-only assets and controls are not exposed here.</p>
      </div>

      <MediaLibraryEditor
        allowMaster={false}
        organizations={(organizations ?? []).map((org) => ({ id: org.id, name: org.name, number: Number(org.organization_number) }))}
        assets={(assets ?? []).map((asset) => ({
          ...asset,
          publicUrl: supabase.storage.from("media-library").getPublicUrl(asset.storage_path).data.publicUrl,
        }))}
      />
    </div>
  );
}
