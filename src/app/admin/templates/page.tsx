import { createTemplate, createTemplateVariant, deleteTemplateVariant, cloneTemplateToStore, updateTemplate } from "./actions";
import { requireSuperAdmin } from "@/lib/auth";

function moneyInput(cents: number | null) {
  return cents == null ? "" : (cents / 100).toFixed(2);
}

export default async function TemplatesPage() {
  const { supabase } = await requireSuperAdmin();

  const [
    { data: templates, error: templateError },
    { data: variants, error: variantError },
    { data: stores, error: storeError },
  ] = await Promise.all([
    supabase.from("product_templates").select("id,name,sku_prefix,description,base_production_cost,category,active,created_at").order("created_at", { ascending: false }),
    supabase.from("product_template_variants").select("id,product_template_id,size,color,sku_suffix,price_override,production_cost_override,availability_status,created_at").order("created_at"),
    supabase.from("stores").select("id,name,slug,status,organizations(name)").neq("status","archived").order("name"),
  ]);

  if (templateError || variantError || storeError) throw new Error("Unable to load product templates.");

  const variantsByTemplate = new Map<string, typeof variants>();
  for (const variant of variants ?? []) {
    const list = variantsByTemplate.get(variant.product_template_id) ?? [];
    list.push(variant);
    variantsByTemplate.set(variant.product_template_id, list);
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-black/45">Reusable catalog</p>
        <h1 className="mt-1 text-3xl font-black">Product templates</h1>
        <p className="mt-2 max-w-3xl text-sm text-black/55">Build a reusable blank product once, including sizes/colors and base production costs, then clone it into any organization storefront. Artwork stays separate from the template.</p>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-sm font-semibold text-black/45">New reusable product</p>
        <h2 className="mt-1 text-2xl font-black">Create template</h2>
        <form action={createTemplate} className="mt-5 grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Template name<input name="name" required maxLength={160} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="Premium Cotton Tee" /></label>
          <label className="grid gap-2 text-sm font-semibold">SKU prefix<input name="skuPrefix" maxLength={80} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="TEE-PC" /></label>
          <label className="grid gap-2 text-sm font-semibold">Category<input name="category" maxLength={80} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="T-Shirts" /></label>
          <label className="grid gap-2 text-sm font-semibold">Base production cost $<input name="baseProductionCost" type="number" min="0" step="0.01" required className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">Description<textarea name="description" rows={3} maxLength={2000} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="flex items-center gap-3 text-sm font-semibold"><input name="active" type="checkbox" defaultChecked className="h-4 w-4" /> Active template</label>
          <button type="submit" className="w-fit rounded-xl bg-black px-5 py-3 font-bold text-white">Create template</button>
        </form>
      </section>

      {(templates ?? []).map((template) => {
        const rows = variantsByTemplate.get(template.id) ?? [];
        return (
          <section key={template.id} className="rounded-2xl border border-black/10 bg-white p-6">
            <form action={updateTemplate} className="grid gap-3 md:grid-cols-2">
              <input type="hidden" name="id" value={template.id} />
              <label className="grid gap-2 text-sm font-semibold">Name<input name="name" defaultValue={template.name} required className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
              <label className="grid gap-2 text-sm font-semibold">SKU prefix<input name="skuPrefix" defaultValue={template.sku_prefix ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
              <label className="grid gap-2 text-sm font-semibold">Category<input name="category" defaultValue={template.category ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
              <label className="grid gap-2 text-sm font-semibold">Base production cost $<input name="baseProductionCost" type="number" min="0" step="0.01" defaultValue={moneyInput(template.base_production_cost)} required className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2">Description<textarea name="description" rows={3} defaultValue={template.description ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
              <label className="flex items-center gap-3 text-sm font-semibold"><input name="active" type="checkbox" defaultChecked={template.active} className="h-4 w-4" /> Active</label>
              <button type="submit" className="w-fit rounded-xl border border-black/15 px-4 py-2.5 text-sm font-bold">Save template</button>
            </form>

            <div className="mt-7 border-t border-black/10 pt-6">
              <p className="text-sm font-semibold text-black/45">Template variants</p>
              <div className="mt-3 grid gap-2">
                {rows.map((variant) => (
                  <div key={variant.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-neutral-50 p-3 text-sm">
                    <div>
                      <strong>{[variant.size,variant.color].filter(Boolean).join(" · ") || "Variant"}</strong>
                      <span className="ml-2 text-black/45">{variant.sku_suffix || "No suffix"}</span>
                      {variant.production_cost_override != null ? <span className="ml-2 text-black/45">cost {moneyInput(variant.production_cost_override)}</span> : null}
                    </div>
                    <form action={deleteTemplateVariant}>
                      <input type="hidden" name="templateId" value={template.id} />
                      <input type="hidden" name="variantId" value={variant.id} />
                      <button type="submit" className="font-semibold underline">Delete</button>
                    </form>
                  </div>
                ))}
                {!rows.length ? <p className="text-sm text-black/40">No template variants yet.</p> : null}
              </div>

              <form action={createTemplateVariant} className="mt-4 grid gap-3 rounded-xl border border-dashed border-black/20 p-4 md:grid-cols-4">
                <input type="hidden" name="templateId" value={template.id} />
                <input name="size" className="rounded-lg border border-black/15 px-3 py-2 text-sm" placeholder="Size, e.g. XL" />
                <input name="color" className="rounded-lg border border-black/15 px-3 py-2 text-sm" placeholder="Color, e.g. Black" />
                <input name="skuSuffix" className="rounded-lg border border-black/15 px-3 py-2 text-sm" placeholder="SKU suffix, e.g. BLK-XL" />
                <select name="availabilityStatus" defaultValue="available" className="rounded-lg border border-black/15 px-3 py-2 text-sm"><option value="available">Available</option><option value="unavailable">Unavailable</option><option value="discontinued">Discontinued</option></select>
                <input name="priceOverride" type="number" min="0" step="0.01" className="rounded-lg border border-black/15 px-3 py-2 text-sm" placeholder="Price override $" />
                <input name="costOverride" type="number" min="0" step="0.01" className="rounded-lg border border-black/15 px-3 py-2 text-sm" placeholder="Cost override $" />
                <button type="submit" className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white">Add variant</button>
              </form>
            </div>

            <div className="mt-7 border-t border-black/10 pt-6">
              <p className="text-sm font-semibold text-black/45">Clone into storefront</p>
              <form action={cloneTemplateToStore} className="mt-4 grid gap-3 md:grid-cols-3">
                <input type="hidden" name="templateId" value={template.id} />
                <label className="grid gap-2 text-sm font-semibold">Store
                  <select name="storeId" required defaultValue="" className="rounded-xl border border-black/15 px-3 py-3 font-normal">
                    <option value="" disabled>Select store</option>
                    {(stores ?? []).map((store) => {
                      const org = Array.isArray(store.organizations) ? store.organizations[0] : store.organizations;
                      return <option key={store.id} value={store.id}>{org?.name ?? "Unknown"} · {store.name}</option>;
                    })}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold">Product name<input name="name" defaultValue={template.name} required className="rounded-xl border border-black/15 px-3 py-3 font-normal" /></label>
                <label className="grid gap-2 text-sm font-semibold">Slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="rounded-xl border border-black/15 px-3 py-3 font-normal" placeholder="premium-cotton-tee" /></label>
                <label className="grid gap-2 text-sm font-semibold">Retail price $<input name="retailPrice" type="number" min="0" step="0.01" required className="rounded-xl border border-black/15 px-3 py-3 font-normal" /></label>
                <label className="grid gap-2 text-sm font-semibold">Revenue share %<input name="revenueShareRate" type="number" min="0" max="100" step="0.01" className="rounded-xl border border-black/15 px-3 py-3 font-normal" /></label>
                <label className="grid gap-2 text-sm font-semibold">Status<select name="status" defaultValue="draft" className="rounded-xl border border-black/15 px-3 py-3 font-normal"><option value="draft">Draft</option><option value="published">Published</option></select></label>
                <label className="flex items-center gap-3 text-sm font-semibold"><input name="featured" type="checkbox" className="h-4 w-4" /> Featured</label>
                <button type="submit" className="w-fit rounded-xl bg-black px-5 py-3 font-bold text-white">Clone to store</button>
              </form>
            </div>
          </section>
        );
      })}
    </div>
  );
}
