import { requireSuperAdmin } from "@/lib/auth";
import {
  createProductCategory,
  createProductCategoryField,
  deleteProductCategoryField,
  updateProductCategory,
  updateProductCategoryField,
} from "./actions";

function csv(values: string[] | null) {
  return (values ?? []).join(", ");
}

export default async function ProductCategoriesPage() {
  const { supabase } = await requireSuperAdmin();
  const [
    { data: categories, error: categoryError },
    { data: fields, error: fieldError },
  ] = await Promise.all([
    supabase.from("product_categories").select("*").order("name"),
    supabase.from("product_category_fields").select("*").order("field_group").order("display_order").order("label"),
  ]);

  if (categoryError || fieldError) throw new Error("Unable to load product categories.");

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-black/45">Onboarding rules</p>
        <h1 className="mt-1 text-3xl font-black">Product categories</h1>
        <p className="mt-2 max-w-4xl text-sm text-black/55">
          Define exactly what appears during onboarding. Category fields can be required, optional, hidden, Super Admin only, grouped, ordered, and configured as text, number, select, checkbox, or textarea inputs.
        </p>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-2xl font-black">Create category</h2>
        <form action={createProductCategory} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Name<input name="name" required className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">Description<textarea name="description" rows={2} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <div className="rounded-xl bg-neutral-50 p-4">
            <label className="flex items-center gap-3 text-sm font-semibold"><input name="usesVariantGroup" type="checkbox" /> Use style / variant group</label>
            <input name="variantGroupLabel" defaultValue="Style" className="mt-3 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
            <input name="defaultVariantGroups" placeholder="Defaults: Fitted, Snapback, Flexfit" className="mt-3 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
          </div>
          <div className="rounded-xl bg-neutral-50 p-4">
            <label className="flex items-center gap-3 text-sm font-semibold"><input name="usesSize" type="checkbox" /> Use size</label>
            <input name="sizeLabel" defaultValue="Size" className="mt-3 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
            <input name="defaultSizes" placeholder="Defaults: S, M, L, XL, 2XL" className="mt-3 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
          </div>
          <div className="rounded-xl bg-neutral-50 p-4">
            <label className="flex items-center gap-3 text-sm font-semibold"><input name="usesColor" type="checkbox" /> Use color</label>
            <input name="colorLabel" defaultValue="Color" className="mt-3 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
            <input name="defaultColors" placeholder="Optional default colors" className="mt-3 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold"><input name="active" type="checkbox" defaultChecked /> Active</label>
          <button className="w-fit rounded-xl bg-black px-5 py-3 font-bold text-white">Create category</button>
        </form>
      </section>

      {(categories ?? []).map((category) => {
        const categoryFields=(fields ?? []).filter((field)=>field.category_id===category.id);
        return (
          <details key={category.id} className="rounded-2xl border border-black/10 bg-white p-6">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">{category.name}</h2>
                  <p className="mt-1 text-sm text-black/45">
                    {[category.uses_variant_group ? category.variant_group_label : "", category.uses_size ? category.size_label : "", category.uses_color ? category.color_label : ""].filter(Boolean).join(" · ") || "No variant axes"}
                    {" · "}{categoryFields.length} custom fields
                  </p>
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black">{category.active ? "Active" : "Inactive"}</span>
              </div>
            </summary>

            <form action={updateProductCategory} className="mt-6 grid gap-4 border-t border-black/10 pt-5 md:grid-cols-2">
              <input type="hidden" name="id" value={category.id} />
              <label className="grid gap-2 text-sm font-semibold">Name<input name="name" required defaultValue={category.name} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
              <label className="grid gap-2 text-sm font-semibold">Slug<input name="slug" required defaultValue={category.slug} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2">Description<textarea name="description" rows={2} defaultValue={category.description ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
              <div className="rounded-xl bg-neutral-50 p-4">
                <label className="flex items-center gap-3 text-sm font-semibold"><input name="usesVariantGroup" type="checkbox" defaultChecked={category.uses_variant_group} /> Use style / variant group</label>
                <input name="variantGroupLabel" defaultValue={category.variant_group_label} className="mt-3 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
                <input name="defaultVariantGroups" defaultValue={csv(category.default_variant_groups)} className="mt-3 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
              </div>
              <div className="rounded-xl bg-neutral-50 p-4">
                <label className="flex items-center gap-3 text-sm font-semibold"><input name="usesSize" type="checkbox" defaultChecked={category.uses_size} /> Use size</label>
                <input name="sizeLabel" defaultValue={category.size_label} className="mt-3 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
                <input name="defaultSizes" defaultValue={csv(category.default_sizes)} className="mt-3 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
              </div>
              <div className="rounded-xl bg-neutral-50 p-4">
                <label className="flex items-center gap-3 text-sm font-semibold"><input name="usesColor" type="checkbox" defaultChecked={category.uses_color} /> Use color</label>
                <input name="colorLabel" defaultValue={category.color_label} className="mt-3 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
                <input name="defaultColors" defaultValue={csv(category.default_colors)} className="mt-3 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-3 text-sm font-semibold"><input name="active" type="checkbox" defaultChecked={category.active} /> Active</label>
              <button className="w-fit rounded-xl border border-black/15 px-4 py-2.5 text-sm font-bold">Save category</button>
            </form>

            <div className="mt-7 border-t border-black/10 pt-6">
              <h3 className="text-xl font-black">Category-specific data fields</h3>
              <p className="mt-1 text-sm text-black/50">These fields appear only for products in {category.name}. Hidden fields are retained in the schema but omitted from onboarding.</p>

              <div className="mt-4 grid gap-4">
                {categoryFields.map((field)=>(
                  <form key={field.id} action={updateProductCategoryField} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 md:grid-cols-4">
                    <input type="hidden" name="categoryId" value={category.id} />
                    <input type="hidden" name="fieldId" value={field.id} />
                    <label className="grid gap-1 text-xs font-semibold">Field key<input name="fieldKey" defaultValue={field.field_key} required pattern="[a-z0-9_]+" className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
                    <label className="grid gap-1 text-xs font-semibold">Label<input name="label" defaultValue={field.label} required className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
                    <label className="grid gap-1 text-xs font-semibold">Input type<select name="fieldType" defaultValue={field.field_type} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal"><option value="text">Text</option><option value="number">Number</option><option value="select">Dropdown</option><option value="boolean">Checkbox</option><option value="textarea">Textarea</option></select></label>
                    <label className="grid gap-1 text-xs font-semibold">Group<input name="fieldGroup" defaultValue={field.field_group} required className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
                    <label className="grid gap-1 text-xs font-semibold">Display order<input name="displayOrder" type="number" min="0" max="999" defaultValue={field.display_order} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
                    <label className="grid gap-1 text-xs font-semibold">Dropdown options<input name="options" defaultValue={csv(field.options)} placeholder="Comma separated" className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
                    <label className="grid gap-1 text-xs font-semibold">Placeholder<input name="placeholder" defaultValue={field.placeholder ?? ""} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
                    <label className="grid gap-1 text-xs font-semibold">Help text<input name="helpText" defaultValue={field.help_text ?? ""} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold md:col-span-4">
                      <label className="flex items-center gap-2"><input name="required" type="checkbox" defaultChecked={field.required} /> Required</label>
                      <label className="flex items-center gap-2"><input name="adminOnly" type="checkbox" defaultChecked={field.admin_only} /> Super Admin only</label>
                      <label className="flex items-center gap-2"><input name="hidden" type="checkbox" defaultChecked={field.hidden} /> Hidden</label>
                    </div>
                    <div className="flex gap-2 md:col-span-4">
                      <button className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white">Save field</button>
                      <button formAction={deleteProductCategoryField} className="rounded-lg border border-black/15 px-4 py-2 text-sm font-bold">Delete field</button>
                    </div>
                  </form>
                ))}
              </div>

              <form action={createProductCategoryField} className="mt-5 grid gap-3 rounded-2xl border border-dashed border-black/20 p-4 md:grid-cols-4">
                <input type="hidden" name="categoryId" value={category.id} />
                <label className="grid gap-1 text-xs font-semibold">Field key<input name="fieldKey" required pattern="[a-z0-9_]+" placeholder="material" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
                <label className="grid gap-1 text-xs font-semibold">Label<input name="label" required placeholder="Material" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
                <label className="grid gap-1 text-xs font-semibold">Input type<select name="fieldType" defaultValue="text" className="rounded-lg border border-black/15 px-3 py-2 font-normal"><option value="text">Text</option><option value="number">Number</option><option value="select">Dropdown</option><option value="boolean">Checkbox</option><option value="textarea">Textarea</option></select></label>
                <label className="grid gap-1 text-xs font-semibold">Group<input name="fieldGroup" defaultValue="Product details" required className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
                <label className="grid gap-1 text-xs font-semibold">Display order<input name="displayOrder" type="number" min="0" max="999" defaultValue="10" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
                <label className="grid gap-1 text-xs font-semibold">Dropdown options<input name="options" placeholder="Comma separated" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
                <label className="grid gap-1 text-xs font-semibold">Placeholder<input name="placeholder" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
                <label className="grid gap-1 text-xs font-semibold">Help text<input name="helpText" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold md:col-span-4">
                  <label className="flex items-center gap-2"><input name="required" type="checkbox" /> Required</label>
                  <label className="flex items-center gap-2"><input name="adminOnly" type="checkbox" defaultChecked /> Super Admin only</label>
                  <label className="flex items-center gap-2"><input name="hidden" type="checkbox" /> Hidden</label>
                </div>
                <button className="w-fit rounded-lg bg-black px-4 py-2 text-sm font-bold text-white md:col-span-4">Add category field</button>
              </form>
            </div>
          </details>
        );
      })}
    </div>
  );
}
