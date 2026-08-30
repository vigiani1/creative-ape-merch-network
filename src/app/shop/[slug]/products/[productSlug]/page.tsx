import { SetupRequired } from "@/components/setup-required";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function ProductPage({ params }: { params: Promise<{ slug: string; productSlug: string }> }) {
  const { slug, productSlug } = await params;
  if (!hasSupabaseEnv()) return <main className="mx-auto max-w-5xl p-8"><SetupRequired area="Product detail" /></main>;

  const supabase = await createClient();
  const { data: store } = await supabase.from("stores").select("id,name,slug").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!store) return <main className="p-8">Store not found.</main>;

  const { data: product } = await supabase.from("products").select("id,name,description,retail_price").eq("store_id", store.id).eq("slug", productSlug).eq("status", "published").maybeSingle();
  if (!product) return <main className="p-8">Product not found.</main>;

  const { data: variants } = await supabase.from("product_variants").select("id,size,color,sku,price_override,availability_status").eq("product_id", product.id).eq("availability_status", "available");

  return (
    <main className="mx-auto grid max-w-6xl gap-10 p-6 py-12 md:grid-cols-2">
      <div className="aspect-square rounded-3xl bg-neutral-100" />
      <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-black/45">{store.name}</p><h1 className="mt-3 text-4xl font-black">{product.name}</h1><p className="mt-4 text-lg text-black/60">{product.description}</p><p className="mt-6 text-2xl font-black">${(Number(product.retail_price) / 100).toFixed(2)}</p><div className="mt-8 grid gap-2">{(variants || []).map((variant) => <div key={variant.id} className="rounded-xl border border-black/10 px-4 py-3 text-sm"><strong>{variant.size || "One size"}</strong>{variant.color ? ` · ${variant.color}` : ""}</div>)}</div><button className="mt-8 w-full rounded-xl bg-black px-5 py-4 font-bold text-white" disabled>Add to cart foundation ready</button></div>
    </main>
  );
}
