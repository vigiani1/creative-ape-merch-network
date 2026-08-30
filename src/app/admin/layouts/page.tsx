import Link from "next/link";
import { applyLayoutToStore, captureStoreAsLayout, setLayoutTemplateActive } from "./actions";
import { requireSuperAdmin } from "@/lib/auth";

export default async function LayoutTemplatesPage() {
  const { supabase } = await requireSuperAdmin();

  const [
    { data: stores, error: storesError },
    { data: templates, error: templatesError },
  ] = await Promise.all([
    supabase.from("stores").select("id,name,slug,status,organizations:organizations!stores_organization_id_fkey(name)").neq("status","archived").order("name"),
    supabase.from("store_layout_templates").select("id,name,slug,description,preview_image_url,active,created_at").order("created_at",{ ascending:false }),
  ]);

  if (storesError || templatesError) throw new Error("Unable to load store layouts.");

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-black/45">Super Admin only</p>
        <h1 className="mt-1 text-3xl font-black">Saved store layouts</h1>
        <p className="mt-2 max-w-4xl text-sm text-black/55">Design a store with the master builders, then save that finished structure as a reusable layout. Applying a saved layout replaces that store’s page/section structure and theme, but does not touch products, orders, organization data, or historical reporting.</p>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-2xl font-black">Capture an existing store as a layout</h2>
        <form action={captureStoreAsLayout} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Source store
            <select name="storeId" required defaultValue="" className="rounded-xl border border-black/15 px-4 py-3 font-normal">
              <option value="" disabled>Select a designed store</option>
              {(stores ?? []).map((store) => {
                const org=Array.isArray(store.organizations)?store.organizations[0]:store.organizations;
                return <option key={store.id} value={store.id}>{org?.name ?? "Unknown"} · {store.name}</option>;
              })}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">Layout name<input name="name" required placeholder="Fundraiser Bold" className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Layout slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="fundraiser-bold" className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Preview image URL<input name="previewImageUrl" placeholder="Optional media-library URL" className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">Description<textarea name="description" rows={3} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <button className="w-fit rounded-xl bg-black px-5 py-3 font-bold text-white">Save layout template</button>
        </form>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {(templates ?? []).map((template) => (
          <section key={template.id} className="rounded-2xl border border-black/10 bg-white p-5">
            {template.preview_image_url ? <img src={template.preview_image_url} alt="" className="aspect-video w-full rounded-xl object-cover" /> : <div className="aspect-video rounded-xl bg-neutral-100" />}
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{template.name}</h2>
                <p className="mt-1 text-xs text-black/45">{template.slug}</p>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black">{template.active ? "Active" : "Hidden"}</span>
            </div>
            {template.description ? <p className="mt-3 text-sm text-black/55">{template.description}</p> : null}

            <form action={setLayoutTemplateActive} className="mt-4 flex items-center gap-3">
              <input type="hidden" name="id" value={template.id} />
              <label className="flex items-center gap-2 text-sm font-semibold"><input name="active" type="checkbox" defaultChecked={template.active} /> Available to organization admins</label>
              <button className="rounded-lg border border-black/15 px-3 py-2 text-xs font-bold">Save</button>
            </form>

            <form action={applyLayoutToStore} className="mt-4 grid gap-3">
              <input type="hidden" name="templateId" value={template.id} />
              <select name="storeId" required defaultValue="" className="rounded-xl border border-black/15 px-3 py-2.5 text-sm">
                <option value="" disabled>Apply to a store...</option>
                {(stores ?? []).map((store) => {
                  const org=Array.isArray(store.organizations)?store.organizations[0]:store.organizations;
                  return <option key={store.id} value={store.id}>{org?.name ?? "Unknown"} · {store.name}</option>;
                })}
              </select>
              <button className="w-fit rounded-lg bg-black px-4 py-2 text-sm font-bold text-white">Apply saved layout</button>
            </form>
          </section>
        ))}
      </div>

      <div className="rounded-2xl bg-neutral-50 p-5 text-sm text-black/55">
        Build the layout itself from <Link href="/admin/stores" className="font-bold underline">Stores</Link>. Home sections use the Store Builder; About, Mission, Cause, and custom pages use the Page Builder.
      </div>
    </div>
  );
}
