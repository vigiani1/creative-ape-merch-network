import { cloneTemplateToStore, createTemplate, createTemplateVariant, deleteTemplateVariant, updateTemplate, updateTemplateVariant } from "./actions";
import { requireSuperAdmin } from "@/lib/auth";

function moneyInput(cents: number | null) { return cents == null ? "" : (cents / 100).toFixed(2); }
function num(value: number | string | null) { return value == null ? "" : String(value); }

export default async function TemplatesPage() {
  const { supabase } = await requireSuperAdmin();
  const [
    { data: templates, error: templateError },
    { data: variants, error: variantError },
    { data: stores, error: storeError },
    { data: vendors, error: vendorError },
  ] = await Promise.all([
    supabase.from("product_templates").select("id,name,sku_prefix,description,base_production_cost,blank_product_cost,production_material_cost,finished_sale_price,profit_each,category,active,vendor_id,vendor_part_number,created_at").order("created_at", { ascending: false }),
    supabase.from("product_template_variants").select("id,product_template_id,variant_group,size,color,sku_suffix,vendor_part_number,price_override,production_cost_override,availability_status,show_on_card,weight_oz,length_in,width_in,height_in,packaging_class,stackable,compressible,ships_alone,created_at").order("created_at"),
    supabase.from("stores").select("id,name,slug,status,organizations(name)").neq("status","archived").order("name"),
    supabase.from("vendors").select("id,name").eq("active",true).order("name"),
  ]);
  if (templateError || variantError || storeError || vendorError) throw new Error("Unable to load product templates.");

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
        <p className="mt-2 max-w-4xl text-sm text-black/55">Templates hold reusable product, vendor, cost, and shipping metadata. Shipping fields stay admin-only and are copied into storefront products when cloned.</p>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-2xl font-black">Create template</h2>
        <form action={createTemplate} className="mt-5 grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Template name<input name="name" required className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">SKU prefix<input name="skuPrefix" className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Vendor
            <select name="vendorId" defaultValue="" className="rounded-xl border border-black/15 px-4 py-3 font-normal">
              <option value="">No vendor</option>
              {(vendors ?? []).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">Vendor part number<input name="vendorPartNumber" className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Category<input name="category" className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <div className="grid gap-3 md:col-span-2 md:grid-cols-4">
            <label className="grid gap-2 text-sm font-semibold">Blank product price $
              <input name="blankProductPrice" type="number" min="0" step="0.01" required className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="0.00" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Production material price $
              <input name="productionMaterialPrice" type="number" min="0" step="0.01" required className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="0.00" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Finished product sale price $
              <input name="finishedSalePrice" type="number" min="0" step="0.01" required className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="0.00" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Profit each
              <div className="rounded-xl border border-dashed border-black/15 bg-neutral-50 px-4 py-3 font-black text-black/45">Calculated after save</div>
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">Description<textarea name="description" rows={3} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="flex items-center gap-3 text-sm font-semibold"><input name="active" type="checkbox" defaultChecked className="h-4 w-4" /> Active</label>
          <button className="w-fit rounded-xl bg-black px-5 py-3 font-bold text-white">Create template</button>
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
              <label className="grid gap-2 text-sm font-semibold">Vendor
                <select name="vendorId" defaultValue={template.vendor_id ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal">
                  <option value="">No vendor</option>
                  {(vendors ?? []).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">Vendor part number<input name="vendorPartNumber" defaultValue={template.vendor_part_number ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
              <label className="grid gap-2 text-sm font-semibold">Category<input name="category" defaultValue={template.category ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
              <div className="grid gap-3 md:col-span-2 md:grid-cols-4">
                <label className="grid gap-2 text-sm font-semibold">Blank product price $
                  <input name="blankProductPrice" type="number" min="0" step="0.01" defaultValue={moneyInput(template.blank_product_cost)} required className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">Production material price $
                  <input name="productionMaterialPrice" type="number" min="0" step="0.01" defaultValue={moneyInput(template.production_material_cost)} required className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">Finished product sale price $
                  <input name="finishedSalePrice" type="number" min="0" step="0.01" defaultValue={moneyInput(template.finished_sale_price)} required className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">Profit each
                  <div className={`rounded-xl border px-4 py-3 font-black ${Number(template.profit_each ?? 0) < 0 ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
                    {moneyInput(template.profit_each ?? 0)}
                  </div>
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2">Description<textarea name="description" rows={3} defaultValue={template.description ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
              <label className="flex items-center gap-3 text-sm font-semibold"><input name="active" type="checkbox" defaultChecked={template.active} className="h-4 w-4" /> Active</label>
              <button className="w-fit rounded-xl border border-black/15 px-4 py-2.5 text-sm font-bold">Save template</button>
            </form>

            <div className="mt-7 border-t border-black/10 pt-6">
              <h3 className="text-xl font-black">Template variants</h3>
              <p className="mt-1 text-sm text-black/50">Weight, dimensions, packaging class, and handling flags are admin-only shipping data.</p>

              <div className="mt-4 grid gap-4">
                {rows.map((variant) => (
                  <form key={variant.id} action={updateTemplateVariant} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 md:grid-cols-4">
                    <input type="hidden" name="templateId" value={template.id} />
                    <input type="hidden" name="variantId" value={variant.id} />
                    <input name="variantGroup" defaultValue={variant.variant_group ?? ""} placeholder="Group: Fitted, Flexfit..." className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
                    <input name="size" defaultValue={variant.size ?? ""} placeholder="Size" className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
                    <input name="color" defaultValue={variant.color ?? ""} placeholder="Color" className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
                    <input name="skuSuffix" defaultValue={variant.sku_suffix ?? ""} placeholder="SKU suffix" className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
                    <input name="vendorPartNumber" defaultValue={variant.vendor_part_number ?? ""} placeholder="Vendor variant part #" className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
                    <input name="priceOverride" type="number" min="0" step="0.01" defaultValue={moneyInput(variant.price_override)} placeholder="Price override $" className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
                    <input name="costOverride" type="number" min="0" step="0.01" defaultValue={moneyInput(variant.production_cost_override)} placeholder="Cost override $" className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
                    <select name="availabilityStatus" defaultValue={variant.availability_status} className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"><option value="available">Available</option><option value="unavailable">Unavailable</option><option value="discontinued">Discontinued</option></select>

                    <input name="weightOz" type="number" min="0" step="0.01" defaultValue={num(variant.weight_oz)} placeholder="Weight oz" className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
                    <input name="lengthIn" type="number" min="0" step="0.01" defaultValue={num(variant.length_in)} placeholder="Length in" className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
                    <input name="widthIn" type="number" min="0" step="0.01" defaultValue={num(variant.width_in)} placeholder="Width in" className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
                    <input name="heightIn" type="number" min="0" step="0.01" defaultValue={num(variant.height_in)} placeholder="Height in" className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
                    <input name="packagingClass" defaultValue={variant.packaging_class ?? ""} placeholder="Packaging class: hat, apparel..." className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />

                    <label className="flex items-center gap-2 text-xs font-semibold"><input name="showOnCard" type="checkbox" defaultChecked={variant.show_on_card} /> Show on storefront</label>
                    <label className="flex items-center gap-2 text-xs font-semibold"><input name="stackable" type="checkbox" defaultChecked={variant.stackable} /> Stackable</label>
                    <label className="flex items-center gap-2 text-xs font-semibold"><input name="compressible" type="checkbox" defaultChecked={variant.compressible} /> Compressible</label>
                    <label className="flex items-center gap-2 text-xs font-semibold"><input name="shipsAlone" type="checkbox" defaultChecked={variant.ships_alone} /> Ships alone</label>

                    <div className="flex gap-2 md:col-span-4">
                      <button className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white">Save variant</button>
                      <button formAction={deleteTemplateVariant} className="rounded-lg border border-black/15 px-4 py-2 text-sm font-bold">Delete</button>
                    </div>
                  </form>
                ))}
              </div>

              <form action={createTemplateVariant} className="mt-5 grid gap-3 rounded-2xl border border-dashed border-black/20 p-4 md:grid-cols-4">
                <input type="hidden" name="templateId" value={template.id} />
                <input name="variantGroup" placeholder="Group" className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
                <input name="size" placeholder="Size" className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
                <input name="color" placeholder="Color" className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
                <input name="skuSuffix" placeholder="SKU suffix" className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
                <input name="vendorPartNumber" placeholder="Vendor part #" className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
                <input name="priceOverride" type="number" min="0" step="0.01" placeholder="Price override $" className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
                <input name="costOverride" type="number" min="0" step="0.01" placeholder="Cost override $" className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
                <select name="availabilityStatus" defaultValue="available" className="rounded-lg border border-black/15 px-3 py-2 text-sm"><option value="available">Available</option><option value="unavailable">Unavailable</option><option value="discontinued">Discontinued</option></select>
                <input name="weightOz" type="number" min="0" step="0.01" placeholder="Weight oz" className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
                <input name="lengthIn" type="number" min="0" step="0.01" placeholder="Length in" className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
                <input name="widthIn" type="number" min="0" step="0.01" placeholder="Width in" className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
                <input name="heightIn" type="number" min="0" step="0.01" placeholder="Height in" className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
                <input name="packagingClass" placeholder="Packaging class" className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
                <label className="flex items-center gap-2 text-xs font-semibold"><input name="showOnCard" type="checkbox" defaultChecked /> Show on storefront</label>
                <label className="flex items-center gap-2 text-xs font-semibold"><input name="stackable" type="checkbox" defaultChecked /> Stackable</label>
                <label className="flex items-center gap-2 text-xs font-semibold"><input name="compressible" type="checkbox" /> Compressible</label>
                <label className="flex items-center gap-2 text-xs font-semibold"><input name="shipsAlone" type="checkbox" /> Ships alone</label>
                <button className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white">Add variant</button>
              </form>
            </div>

            <div className="mt-7 border-t border-black/10 pt-6">
              <h3 className="text-xl font-black">Clone into storefront</h3>
              <form action={cloneTemplateToStore} className="mt-4 grid gap-3 md:grid-cols-3">
                <input type="hidden" name="templateId" value={template.id} />
                <label className="grid gap-2 text-sm font-semibold">Store<select name="storeId" required defaultValue="" className="rounded-xl border border-black/15 px-3 py-3 font-normal"><option value="" disabled>Select store</option>{(stores ?? []).map(store => { const org=Array.isArray(store.organizations)?store.organizations[0]:store.organizations; return <option key={store.id} value={store.id}>{org?.name ?? "Unknown"} · {store.name}</option>; })}</select></label>
                <label className="grid gap-2 text-sm font-semibold">Product name<input name="name" defaultValue={template.name} required className="rounded-xl border border-black/15 px-3 py-3 font-normal" /></label>
                <label className="grid gap-2 text-sm font-semibold">Slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="rounded-xl border border-black/15 px-3 py-3 font-normal" /></label>
                <label className="grid gap-2 text-sm font-semibold">Retail price $<input name="retailPrice" type="number" min="0" step="0.01" defaultValue={moneyInput(template.finished_sale_price)} required className="rounded-xl border border-black/15 px-3 py-3 font-normal" /></label>
                <label className="grid gap-2 text-sm font-semibold">Revenue share %<input name="revenueShareRate" type="number" min="0" max="100" step="0.01" className="rounded-xl border border-black/15 px-3 py-3 font-normal" /></label>
                <label className="grid gap-2 text-sm font-semibold">Status<select name="status" defaultValue="draft" className="rounded-xl border border-black/15 px-3 py-3 font-normal"><option value="draft">Draft</option><option value="published">Published</option></select></label>
                <label className="flex items-center gap-3 text-sm font-semibold"><input name="featured" type="checkbox" /> Featured</label>
                <button className="w-fit rounded-xl bg-black px-5 py-3 font-bold text-white">Clone to store</button>
              </form>
            </div>
          </section>
        );
      })}
    </div>
  );
}
