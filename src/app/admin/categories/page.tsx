import { requireSuperAdmin } from "@/lib/auth";
import { createProductCategory, updateProductCategory } from "./actions";

function csv(values: string[] | null) {
  return (values ?? []).join(", ");
}

export default async function ProductCategoriesPage() {
  const { supabase } = await requireSuperAdmin();
  const { data: categories, error } = await supabase
    .from("product_categories")
    .select("*")
    .order("name");

  if (error) throw new Error("Unable to load product categories.");

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-black/45">Onboarding rules</p>
        <h1 className="mt-1 text-3xl font-black">Product categories</h1>
        <p className="mt-2 max-w-4xl text-sm text-black/55">
          Categories control which variant fields appear when a new vendor product is onboarded. A saved vendor part number then remembers its exact variants for future use.
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

      {(categories ?? []).map((category) => (
        <details key={category.id} className="rounded-2xl border border-black/10 bg-white p-6">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">{category.name}</h2>
                <p className="mt-1 text-sm text-black/45">
                  {[category.uses_variant_group ? category.variant_group_label : "", category.uses_size ? category.size_label : "", category.uses_color ? category.color_label : ""].filter(Boolean).join(" · ") || "No variant axes"}
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
        </details>
      ))}
    </div>
  );
}
