import Link from "next/link";
import { notFound } from "next/navigation";
import { updateProduct } from "../actions";
import { requireSuperAdmin } from "@/lib/auth";

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireSuperAdmin();

  const { data: product, error } = await supabase
    .from("products")
    .select("id,name,slug,description,sku,category,status,retail_price,production_cost,default_revenue_share_rate,featured,stores(slug)")
    .eq("id", id)
    .maybeSingle();

  if (error || !product) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/products" className="text-sm font-semibold underline">Back to products</Link>
      <form action={updateProduct} className="mt-5 grid gap-4 rounded-2xl border border-black/10 bg-white p-6">
        <input type="hidden" name="id" value={product.id} />
        <h1 className="text-2xl font-black">Edit product</h1>

        <label className="grid gap-2 text-sm font-semibold">Name
          <input name="name" defaultValue={product.name} required maxLength={160} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
        </label>

        <label className="grid gap-2 text-sm font-semibold">Slug
          <input name="slug" defaultValue={product.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
        </label>

        <label className="grid gap-2 text-sm font-semibold">SKU
          <input name="sku" defaultValue={product.sku ?? ""} maxLength={80} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
        </label>

        <label className="grid gap-2 text-sm font-semibold">Category
          <input name="category" defaultValue={product.category ?? ""} maxLength={80} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
        </label>

        <label className="grid gap-2 text-sm font-semibold">Description
          <textarea name="description" defaultValue={product.description ?? ""} rows={5} maxLength={2000} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-2 text-sm font-semibold">Retail $
            <input name="retailPrice" type="number" min="0" step="0.01" defaultValue={(product.retail_price / 100).toFixed(2)} required className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">Production cost $
            <input name="productionCost" type="number" min="0" step="0.01" defaultValue={(product.production_cost / 100).toFixed(2)} required className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-semibold">Revenue share %
          <input name="revenueShareRate" type="number" min="0" max="100" step="0.01" defaultValue={product.default_revenue_share_rate ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
        </label>

        <label className="grid gap-2 text-sm font-semibold">Status
          <select name="status" defaultValue={product.status} className="rounded-xl border border-black/15 px-4 py-3 font-normal">
            <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
          </select>
        </label>

        <label className="flex items-center gap-3 text-sm font-semibold">
          <input name="featured" type="checkbox" defaultChecked={product.featured} className="h-4 w-4" /> Featured product
        </label>

        <button type="submit" className="rounded-xl bg-black px-5 py-3 font-bold text-white">Save changes</button>
      </form>
    </div>
  );
}
