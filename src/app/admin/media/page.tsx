import { MediaLibraryEditor } from "@/components/media-library-editor";
import { requireSuperAdmin } from "@/lib/auth";

export default async function MediaPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const query = await searchParams;
  const selectedStoreId = typeof query.store === "string" ? query.store : undefined;
  const { supabase } = await requireSuperAdmin();

  const [{ data: organizations, error: orgError }, { data: assets, error: assetError }, { data: selectedStore }] = await Promise.all([
    supabase.from("organizations").select("id,name,organization_number").neq("status","archived").order("name"),
    supabase.from("media_assets").select("id,organization_id,scope,media_type,title,file_name,mime_type,storage_path,alt_text,tags").order("created_at",{ ascending:false }),
    selectedStoreId ? supabase.from("stores").select("organization_id").eq("id",selectedStoreId).maybeSingle() : Promise.resolve({ data:null, error:null }),
  ]);

  if (orgError || assetError) throw new Error("Unable to load Media Library.");

  const resolvedAssets=(assets ?? []).map((asset)=>({
    ...asset,
    publicUrl:supabase.storage.from("media-library").getPublicUrl(asset.storage_path).data.publicUrl,
  }));

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p className="admin-kicker">Assets</p>
          <h2>Media Library</h2>
          <p>Upload once, then reuse product photography, logos, campaign art, video, and PDFs.</p>
        </div>
      </section>

      <MediaLibraryEditor
        allowMaster
        organizations={(organizations ?? []).map((org) => ({
          id: org.id,
          name: org.name,
          number: Number(org.organization_number),
        }))}
        assets={resolvedAssets}
        initialOrganizationId={selectedStore?.organization_id ?? ""}
        initialScope={selectedStore?.organization_id ? "organization" : "master"}
      />
    </div>
  );
}
