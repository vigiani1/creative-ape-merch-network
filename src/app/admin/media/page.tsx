import { ProductMediaEditor } from "@/components/admin/product-media-editor";
import { requireSuperAdmin } from "@/lib/auth";

export default async function MediaPage() {
  const { supabase } = await requireSuperAdmin();

  const [{ data: products, error: productsError }, { data: mediaRows, error: mediaError }] = await Promise.all([
    supabase
      .from("products")
      .select("id,organization_id,name,status")
      .neq("status", "archived")
      .order("created_at", { ascending: false }),
    supabase
      .from("product_media")
      .select("id,product_id,media_type,storage_path,external_url,alt_text,is_primary,display_order")
      .order("display_order", { ascending: true }),
  ]);

  if (productsError || mediaError) throw new Error("Unable to load product media.");

  const mediaByProduct = new Map<string, typeof mediaRows>();
  for (const item of mediaRows ?? []) {
    const list = mediaByProduct.get(item.product_id) ?? [];
    list.push(item);
    mediaByProduct.set(item.product_id, list);
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-black/45">Catalog visuals</p>
        <h1 className="mt-1 text-2xl font-black">Product media</h1>
        <p className="mt-2 max-w-3xl text-sm text-black/55">Upload product photos or short videos directly to Supabase Storage. The primary image becomes the storefront card image.</p>
      </div>

      {(products ?? []).map((product) => (
        <ProductMediaEditor
          key={product.id}
          productId={product.id}
          organizationId={product.organization_id}
          productName={product.name}
          media={(mediaByProduct.get(product.id) ?? []).map((item) => ({
            id: item.id,
            media_type: item.media_type,
            storage_path: item.storage_path,
            external_url: item.external_url,
            alt_text: item.alt_text,
            is_primary: item.is_primary,
          }))}
        />
      ))}

      {!products?.length ? <div className="rounded-2xl border border-black/10 bg-white p-8 text-sm text-black/50">Create a product first, then its media controls will appear here.</div> : null}
    </div>
  );
}
