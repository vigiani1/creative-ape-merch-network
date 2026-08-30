import Link from "next/link";
import { createStore } from "./actions";
import { requireSuperAdmin } from "@/lib/auth";

export default async function StoresPage() {
  const { supabase } = await requireSuperAdmin();

  const [{ data: organizations, error: orgError }, { data: stores, error: storeError }] = await Promise.all([
    supabase.from("organizations").select("id,name").eq("status", "active").order("name"),
    supabase
      .from("stores")
      .select("id,organization_id,name,slug,title,status,published_at,organizations(name)")
      .order("created_at", { ascending: false }),
  ]);

  if (orgError || storeError) throw new Error("Unable to load stores.");

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-black/45">Storefronts</p>
            <h2 className="mt-1 text-2xl font-black">Stores</h2>
          </div>
          <p className="text-sm text-black/50">{stores?.length ?? 0} total</p>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-black/10 text-black/45">
              <tr>
                <th className="py-3 pr-4 font-semibold">Store</th>
                <th className="py-3 pr-4 font-semibold">Organization</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 pr-4 font-semibold">Slug</th>
                <th className="py-3 font-semibold">Public page</th>
              </tr>
            </thead>
            <tbody>
              {(stores ?? []).map((store) => {
                const org = Array.isArray(store.organizations) ? store.organizations[0] : store.organizations;
                return (
                  <tr key={store.id} className="border-b border-black/5 last:border-0">
                    <td className="py-4 pr-4">
                      <p className="font-bold">{store.title || store.name}</p>
                      {store.title && store.title !== store.name ? <p className="mt-1 text-xs text-black/45">{store.name}</p> : null}
                    </td>
                    <td className="py-4 pr-4">{org?.name ?? "Unknown"}</td>
                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{store.status}</span>
                    </td>
                    <td className="py-4 pr-4 font-mono text-xs">{store.slug}</td>
                    <td className="py-4">
                      {store.status === "published" ? (
                        <Link className="font-semibold underline" href={`/shop/${store.slug}`} target="_blank">Open store</Link>
                      ) : (
                        <span className="text-black/35">Not published</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!stores?.length && (
                <tr><td colSpan={5} className="py-10 text-center text-black/45">No stores yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-sm font-semibold text-black/45">New storefront</p>
        <h2 className="mt-1 text-2xl font-black">Create store</h2>
        <p className="mt-2 text-sm text-black/55">Each storefront belongs to one organization and gets its own default theme automatically.</p>

        <form action={createStore} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">
            Organization
            <select name="organizationId" required defaultValue="" className="rounded-xl border border-black/15 px-4 py-3 font-normal">
              <option value="" disabled>Select organization</option>
              {(organizations ?? []).map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Store name
            <input name="name" required minLength={2} maxLength={120} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="Example Spirit Shop" />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Public slug
            <input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="example-spirit-shop" />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Public title
            <input name="title" maxLength={160} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="Example High School Spirit Shop" />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Description
            <textarea name="description" rows={4} maxLength={1000} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="Tell customers what this store supports." />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Initial status
            <select name="status" defaultValue="draft" className="rounded-xl border border-black/15 px-4 py-3 font-normal">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>

          <button type="submit" className="mt-2 rounded-xl bg-black px-5 py-3 font-bold text-white">Create store</button>
        </form>
      </aside>
    </div>
  );
}
