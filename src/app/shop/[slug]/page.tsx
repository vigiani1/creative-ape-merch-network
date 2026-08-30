import Link from "next/link";
import { SetupRequired } from "@/components/setup-required";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { PublicProduct, PublicStore } from "@/lib/supabase/public-types";

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabaseEnv()) return <main className="mx-auto max-w-5xl p-8"><SetupRequired area={`Storefront /shop/${slug}`} /></main>;

  const supabase = await createClient();
  const { data: stores } = await supabase.rpc("get_public_store", { store_slug: slug });
  const store = stores?.[0] as PublicStore | undefined;

  if (!store) return <main className="mx-auto max-w-5xl p-8"><h1 className="text-3xl font-black">Store not found</h1><p className="mt-3 text-black/60">This storefront is not published or does not exist.</p></main>;

  const { data: products } = await supabase.rpc("get_public_store_products", { target_store_id: store.id });

  return (
    <main className="min-h-screen bg-white">
      <section className="border-b border-black/10 bg-neutral-950 px-6 py-16 text-white"><div className="mx-auto max-w-6xl"><p className="text-sm font-bold uppercase tracking-[0.2em]">Creative Ape Merch Network</p><h1 className="mt-4 text-5xl font-black">{store.title || store.name}</h1><p className="mt-4 max-w-2xl text-white/65">{store.description}</p></div></section>
      <section className="mx-auto grid max-w-6xl gap-5 px-6 py-10 md:grid-cols-2 lg:grid-cols-3">
        {((products || []) as PublicProduct[]).map((product) => <Link key={product.id} href={`/shop/${store.slug}/products/${product.slug}`} className="rounded-2xl border border-black/10 p-5 hover:border-black/30"><div className="aspect-square rounded-xl bg-neutral-100" /><h2 className="mt-4 text-lg font-bold">{product.name}</h2><p className="mt-1 line-clamp-2 text-sm text-black/55">{product.description}</p><p className="mt-4 font-black">${(Number(product.retail_price) / 100).toFixed(2)}</p></Link>)}
      </section>
    </main>
  );
}
