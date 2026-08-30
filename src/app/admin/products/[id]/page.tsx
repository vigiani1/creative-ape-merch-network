import Link from "next/link";
import { notFound } from "next/navigation";
import { createVariant, deleteVariant, updateProduct, updateVariant } from "../actions";
import { requireSuperAdmin } from "@/lib/auth";

function dollars(cents: number | null) {
  return cents === null ? "" : (cents / 100).toFixed(2);
}

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireSuperAdmin();

  const [{ data: product, error }, { data: variants, error: variantsError }] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,slug,description,sku,category,status,retail_price,production_cost,default_revenue_share_rate,featured,stores(slug)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("product_variants")
      .select("id,size,color,sku,price_override,production_cost_override,inventory_quantity,availability_status")
      .eq("product_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (error || variantsError || !product) notFound();

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div><Link href="/admin/products" className="text-sm font-semibold underline">Back to products</Link></div>

      <form action={updateProduct} className="grid gap-4 rounded-2xl border border-black/10 bg-white p-6">
        <input type="hidden" name="id" value={product.id} />
        <h1 className="text-2xl font-black">Edit product</h1>

        <div className="grid gap-4 md:grid-cols-2">
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
        </div>

        <label className="grid gap-2 text-sm font-semibold">Description
          <textarea name="description" defaultValue={product.description ?? ""} rows={5} maxLength={2000} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-2 text-sm font-semibold">Retail $
            <input name="retailPrice" type="number" min="0" step="0.01" defaultValue={(product.retail_price / 100).toFixed(2)} required className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
          </label>

          <label className="grid gap-2 text-sm font-semibold">Production cost $
            <input name="productionCost" type="number" min="0" step="0.01" defaultValue={(product.production_cost / 100).toFixed(2)} required className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
          </label>

          <label className="grid gap-2 text-sm font-semibold">Revenue share %
            <input name="revenueShareRate" type="number" min="0" max="100" step="0.01" defaultValue={product.default_revenue_share_rate ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
          </label>

          <label className="grid gap-2 text-sm font-semibold">Status
            <select name="status" defaultValue={product.status} className="rounded-xl border border-black/15 px-4 py-3 font-normal">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>

        <label className="flex items-center gap-3 text-sm font-semibold">
          <input name="featured" type="checkbox" defaultChecked={product.featured} className="h-4 w-4" /> Featured product
        </label>

        <button type="submit" className="w-fit rounded-xl bg-black px-5 py-3 font-bold text-white">Save product</button>
      </form>

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <div>
          <p className="text-sm font-semibold text-black/45">Sizes, colors, SKUs & inventory</p>
          <h2 className="mt-1 text-2xl font-black">Variants</h2>
          <p className="mt-2 text-sm text-black/55">Overrides are optional. Leave price or cost blank to inherit the main product values.</p>
        </div>

        <div className="mt-6 grid gap-4">
          {(variants ?? []).map((variant) => (
            <form key={variant.id} action={updateVariant} className="grid gap-3 rounded-2xl border border-black/10 p-4 lg:grid-cols-8 lg:items-end">
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="variantId" value={variant.id} />

              <label className="grid gap-1 text-xs font-semibold">Size
                <input name="size" defaultValue={variant.size ?? ""} maxLength={80} className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
              </label>

              <label className="grid gap-1 text-xs font-semibold">Color
                <input name="color" defaultValue={variant.color ?? ""} maxLength={80} className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
              </label>

              <label className="grid gap-1 text-xs font-semibold">SKU
                <input name="sku" defaultValue={variant.sku ?? ""} maxLength={120} className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
              </label>

              <label className="grid gap-1 text-xs font-semibold">Price override $
                <input name="priceOverride" type="number" min="0" step="0.01" defaultValue={dollars(variant.price_override)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
              </label>

              <label className="grid gap-1 text-xs font-semibold">Cost override $
                <input name="productionCostOverride" type="number" min="0" step="0.01" defaultValue={dollars(variant.production_cost_override)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
              </label>

              <label className="grid gap-1 text-xs font-semibold">Inventory
                <input name="inventoryQuantity" type="number" min="0" step="1" defaultValue={variant.inventory_quantity ?? ""} className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
              </label>

              <label className="grid gap-1 text-xs font-semibold">Availability
                <select name="availabilityStatus" defaultValue={variant.availability_status} className="rounded-lg border border-black/15 px-3 py-2 font-normal">
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </label>

              <div className="flex gap-2">
                <button type="submit" className="rounded-lg bg-black px-3 py-2 text-xs font-bold text-white">Save</button>
                <button formAction={deleteVariant} type="submit" className="rounded-lg border border-black/15 px-3 py-2 text-xs font-bold">Delete</button>
              </div>
            </form>
          ))}

          {!variants?.length ? <p className="rounded-xl bg-neutral-50 p-4 text-sm text-black/45">No variants yet.</p> : null}
        </div>

        <form action={createVariant} className="mt-7 grid gap-3 rounded-2xl bg-neutral-50 p-4 lg:grid-cols-8 lg:items-end">
          <input type="hidden" name="productId" value={product.id} />

          <label className="grid gap-1 text-xs font-semibold">Size
            <input name="size" maxLength={80} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" placeholder="XL" />
          </label>

          <label className="grid gap-1 text-xs font-semibold">Color
            <input name="color" maxLength={80} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" placeholder="Black" />
          </label>

          <label className="grid gap-1 text-xs font-semibold">SKU
            <input name="sku" maxLength={120} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" placeholder="TEE-BLK-XL" />
          </label>

          <label className="grid gap-1 text-xs font-semibold">Price override $
            <input name="priceOverride" type="number" min="0" step="0.01" className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" />
          </label>

          <label className="grid gap-1 text-xs font-semibold">Cost override $
            <input name="productionCostOverride" type="number" min="0" step="0.01" className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" />
          </label>

          <label className="grid gap-1 text-xs font-semibold">Inventory
            <input name="inventoryQuantity" type="number" min="0" step="1" className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" />
          </label>

          <label className="grid gap-1 text-xs font-semibold">Availability
            <select name="availabilityStatus" defaultValue="available" className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal">
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </label>

          <button type="submit" className="rounded-lg bg-black px-3 py-2 text-xs font-bold text-white">Add variant</button>
        </form>
      </section>
    </div>
  );
}
