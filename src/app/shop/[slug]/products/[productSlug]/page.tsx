import { SetupRequired } from "@/components/setup-required";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function ProductPage({ params }: { params: Promise<{ slug: string; productSlug: string }> }) {
  const { slug, productSlug } = await params;
  if (!hasSupabaseEnv()) return <main className="mx-auto max-w-5xl p-8"><SetupRequired area="Product detail" /></main>;

  const supabase = await createClient();
  const { data: stores } = await supabase.rpc("get_public_store", { store_slug: slug });
  const store = stores?.[0];
  if (!store) return <main className="p-8">Store not found.</main>;

  const { data: products } = await supabase.rpc("get_public_product", { target_store_id: store.id, product_slug: productSlug });
  const product = products?.[0];
  if (!product) return <main className="p-8">Product not found.</main>;

  const { data: variants } = await supabase.rpc("get_public_product_variants", { target_product_id: product.id });

  return (
    <main className="mx-auto grid max-w-6xl gap-10 p-6 py-12 md:grid-cols-2">
      <div className="aspect-square rounded-3xl bg-neutral-100" />
      <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-black/45">{store.name}</p><h1 className="mt-3 text-4xl font-black">{product.name}</h1><p className="mt-4 text-lg text-black/60">{product.description}</p><p className="mt-6 text-2xl font-black">${(Number(product.retail_price) / 100).toFixed(2)}</p><div className="mt-8 grid gap-2">{(variants || []).map((variant) => <div key={variant.id} className="rounded-xl border border-black/10 px-4 py-3 text-sm"><strong>{variant.size || "One size"}</strong>{variant.color ? ` · ${variant.color}` : ""}</div>)}</div><button className="mt-8 w-full rounded-xl bg-black px-5 py-4 font-bold text-white" disabled>Add to cart foundation ready</button></div>
    </main>
  );
}
