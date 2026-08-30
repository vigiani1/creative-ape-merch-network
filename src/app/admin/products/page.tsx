import Link from "next/link";
import { createProduct } from "./actions";
import { requireSuperAdmin } from "@/lib/auth";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function ProductsPage() {
  const { supabase } = await requireSuperAdmin();

  const [{ data: stores, error: storesError }, { data: products, error: productsError }] = await Promise.all([
    supabase
      .from("stores")
      .select("id,name,slug,status,organization_id,organizations(name)")
      .neq("status", "archived")
      .order("name"),
    supabase
      .from("products")
      .select("id,name,slug,sku,category,status,retail_price,production_cost,markup_amount,featured,store_id,stores(name,slug),organizations(name)")
      .order("created_at", { ascending: false }),
  ]);

  if (storesError || productsError) throw new Error("Unable to load products.");

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-black/45">Catalog</p>
            <h2 className="mt-1 text-2xl font-black">Products</h2>
          </div>
          <p className="text-sm text-black/50">{products?.length ?? 0} total</p>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-black/10 text-black/45">
              <tr>
                <th className="py-3 pr-4 font-semibold">Product</th>
                <th className="py-3 pr-4 font-semibold">Store</th>
                <th className="py-3 pr-4 font-semibold">Retail</th>
                <th className="py-3 pr-4 font-semibold">Cost</th>
                <th className="py-3 pr-4 font-semibold">Markup</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 pr-4 font-semibold">Page</th>
                <th className="py-3 font-semibold">Manage</th>
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((product) => {
                const store = Array.isArray(product.stores) ? product.stores[0] : product.stores;
                const org = Array.isArray(product.organizations) ? product.organizations[0] : product.organizations;
                return (
                  <tr key={product.id} className="border-b border-black/5 last:border-0">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{product.name}</p>
                        {product.featured ? <span title="Featured">★</span> : null}
                      </div>
                      <p className="mt-1 text-xs text-black/45">{product.sku || product.category || product.slug}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p>{store?.name ?? "Unknown"}</p>
                      <p className="mt-1 text-xs text-black/45">{org?.name ?? ""}</p>
                    </td>
                    <td className="py-4 pr-4 font-semibold">{money(product.retail_price)}</td>
                    <td className="py-4 pr-4">{money(product.production_cost)}</td>
                    <td className="py-4 pr-4">{money(product.markup_amount ?? 0)}</td>
                    <td className="py-4 pr-4"><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{product.status}</span></td>
                    <td className="py-4">
                      {product.status === "published" && store?.slug ? (
                        <Link className="font-semibold underline" href={`/shop/${store.slug}/products/${product.slug}`} target="_blank">Open</Link>
                      ) : <span className="text-black/35">Not published</span>}
                    </td>
                    <td className="py-4"><Link href={`/admin/products/${product.id}`} className="font-semibold underline">Edit</Link></td>
                  </tr>
                );
              })}
              {!products?.length && <tr><td colSpan={8} className="py-10 text-center text-black/45">No products yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-sm font-semibold text-black/45">New catalog item</p>
        <h2 className="mt-1 text-2xl font-black">Create product</h2>
        <p className="mt-2 text-sm text-black/55">Pricing is stored in cents, while this form accepts normal dollar amounts. Markup is calculated automatically.</p>

        <form action={createProduct} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">
            Store
            <select name="storeId" required defaultValue="" className="rounded-xl border border-black/15 px-4 py-3 font-normal">
              <option value="" disabled>Select store</option>
              {(stores ?? []).map((store) => {
                const org = Array.isArray(store.organizations) ? store.organizations[0] : store.organizations;
                return <option key={store.id} value={store.id}>{org?.name ? `${org.name} · ` : ""}{store.name}</option>;
              })}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold">Product name<input name="name" required maxLength={160} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="Logo Tee" /></label>
          <label className="grid gap-2 text-sm font-semibold">Product slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="logo-tee" /></label>
          <label className="grid gap-2 text-sm font-semibold">SKU<input name="sku" maxLength={80} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="TEE-001" /></label>
          <label className="grid gap-2 text-sm font-semibold">Category<input name="category" maxLength={80} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="Apparel" /></label>
          <label className="grid gap-2 text-sm font-semibold">Description<textarea name="description" rows={3} maxLength={2000} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2 text-sm font-semibold">Retail $<input name="retailPrice" type="number" min="0" step="0.01" required className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="25.00" /></label>
            <label className="grid gap-2 text-sm font-semibold">Production cost $<input name="productionCost" type="number" min="0" step="0.01" required className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="10.00" /></label>
          </div>

          <label className="grid gap-2 text-sm font-semibold">Revenue share % <span className="font-normal text-black/45">Leave blank to inherit organization default.</span><input name="revenueShareRate" type="number" min="0" max="100" step="0.01" className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Sizes <span className="font-normal text-black/45">Comma separated. Example: S, M, L, XL, 2XL</span><input name="sizes" maxLength={500} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="S, M, L, XL, 2XL" /></label>

          <label className="grid gap-2 text-sm font-semibold">Initial status<select name="status" defaultValue="draft" className="rounded-xl border border-black/15 px-4 py-3 font-normal"><option value="draft">Draft</option><option value="published">Published</option></select></label>
          <label className="flex items-center gap-3 text-sm font-semibold"><input name="featured" type="checkbox" className="h-4 w-4" /> Featured product</label>

          <button type="submit" className="mt-2 rounded-xl bg-black px-5 py-3 font-bold text-white">Create product</button>
        </form>
      </aside>
    </div>
  );
}
