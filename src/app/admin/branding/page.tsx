import { StoreBrandingEditor } from "@/components/admin/store-branding-editor";
import { requireSuperAdmin } from "@/lib/auth";

export default async function BrandingPage() {
  const { supabase } = await requireSuperAdmin();

  const { data: stores, error } = await supabase
    .from("stores")
    .select("id,organization_id,name,slug,status,store_themes(logo_url,hero_image_url,primary_color,secondary_color,accent_color,background_color,text_color),organizations(name)")
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load store branding.");

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-black/45">Brand system</p>
        <h1 className="mt-1 text-2xl font-black">Branding</h1>
        <p className="mt-2 max-w-3xl text-sm text-black/55">Upload each store logo and hero image, then tune the storefront color palette. Assets are stored in Supabase Storage and served publicly to the storefront.</p>
      </div>

      {(stores ?? []).map((store) => {
        const theme = Array.isArray(store.store_themes) ? store.store_themes[0] : store.store_themes;
        if (!theme) return null;
        return (
          <StoreBrandingEditor
            key={store.id}
            storeId={store.id}
            organizationId={store.organization_id}
            storeName={store.name}
            theme={theme}
          />
        );
      })}

      {!stores?.length ? <div className="rounded-2xl border border-black/10 bg-white p-8 text-sm text-black/50">Create a store first, then branding controls will appear here.</div> : null}
    </div>
  );
}
