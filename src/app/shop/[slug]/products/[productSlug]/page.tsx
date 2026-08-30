import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { SetupRequired } from "@/components/setup-required";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { PublicProduct, PublicStore, PublicVariant } from "@/lib/supabase/public-types";

type PublicTheme = {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
};

type PublicMedia = {
  id: string;
  media_type: string;
  storage_path: string | null;
  external_url: string | null;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
};

export default async function ProductPage({ params }: { params: Promise<{ slug: string; productSlug: string }> }) {
  const { slug, productSlug } = await params;
  if (!hasSupabaseEnv()) return <main className="mx-auto max-w-5xl p-8"><SetupRequired area="Product detail" /></main>;

  const supabase = await createClient();
  const { data: stores } = await supabase.rpc("get_public_store", { store_slug: slug });
  const store = stores?.[0] as PublicStore | undefined;
  if (!store) return <main className="p-8">Store not found.</main>;

  const { data: products } = await supabase.rpc("get_public_product", { target_store_id: store.id, product_slug: productSlug });
  const product = products?.[0] as PublicProduct | undefined;
  if (!product) return <main className="p-8">Product not found.</main>;

  const [{ data: variants }, mediaResult, themeResult] = await Promise.all([
    supabase.rpc("get_public_product_variants", { target_product_id: product.id }),
    (supabase.rpc as any)("get_public_product_media", { target_product_id: product.id }),
    (supabase.rpc as any)("get_public_store_theme", { target_store_id: store.id }),
  ]);

  const theme = themeResult.data?.[0] as PublicTheme | undefined;
  const media = ((mediaResult.data || []) as PublicMedia[]).map((item) => {
    const url = item.external_url ?? (item.storage_path ? supabase.storage.from("product-media").getPublicUrl(item.storage_path).data.publicUrl : null);
    return { ...item, url };
  });

  const primary = media.find((item) => item.is_primary && item.media_type === "image") ?? media.find((item) => item.media_type === "image") ?? media[0];

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: theme?.background_color ?? "#ffffff",
        color: theme?.text_color ?? "#111111",
      }}
    >
      <div className="mx-auto max-w-6xl p-6 py-12">
        <div className="mb-6 flex justify-between text-sm">
          <Link href={`/shop/${store.slug}`} className="font-semibold underline">Back to store</Link>
          <Link href="/cart" className="font-semibold underline">Cart</Link>
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="aspect-square overflow-hidden rounded-3xl bg-neutral-100">
              {primary?.url && primary.media_type === "video" ? (
                <video src={primary.url} controls className="h-full w-full object-cover" />
              ) : primary?.url ? (
                <img src={primary.url} alt={primary.alt_text ?? product.name} className="h-full w-full object-cover" />
              ) : null}
            </div>

            {media.length > 1 ? (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {media.slice(0, 8).map((item) => (
                  <div key={item.id} className="aspect-square overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-black/10">
                    {item.url && item.media_type === "video" ? (
                      <video src={item.url} muted className="h-full w-full object-cover" />
                    ) : item.url ? (
                      <img src={item.url} alt={item.alt_text ?? product.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] opacity-45">{store.name}</p>
            <h1 className="mt-3 text-4xl font-black">{product.name}</h1>
            <p className="mt-4 text-lg opacity-60">{product.description}</p>
            <p className="mt-6 text-2xl font-black" style={{ color: theme?.secondary_color ?? "inherit" }}>${(Number(product.retail_price) / 100).toFixed(2)}</p>

            <div className="mt-8 grid gap-2">
              {((variants || []) as PublicVariant[]).map((variant) => (
                <div key={variant.id} className="rounded-xl border border-black/10 px-4 py-3 text-sm">
                  <strong>{variant.size || "One size"}</strong>{variant.color ? ` · ${variant.color}` : ""}
                </div>
              ))}
            </div>

            <AddToCartButton productId={product.id} storeSlug={store.slug} name={product.name} unitPrice={Number(product.retail_price)} />
          </div>
        </div>
      </div>
    </main>
  );
}
