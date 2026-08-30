import Link from "next/link";
import { applyOrganizationLayout } from "./actions";
import { requireOrganizationMembership } from "@/lib/auth";

export default async function PortalStoresPage() {
  const { supabase, organizationIds } = await requireOrganizationMembership();
  const { data: auth } = await supabase.auth.getUser();

  const [
    { data: stores, error: storesError },
    { data: layouts, error: layoutsError },
    { data: memberships, error: membershipError },
  ] = await Promise.all([
    supabase
      .from("stores")
      .select("id,name,title,slug,status,published_at,organization_id,layout_template_id,availability_status,starts_at,ends_at")
      .in("organization_id", organizationIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("store_layout_templates")
      .select("id,name,description,preview_image_url")
      .eq("active", true)
      .order("name"),
    auth.user
      ? supabase.from("organization_members").select("organization_id,role").eq("user_id", auth.user.id).in("organization_id", organizationIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (storesError || layoutsError || membershipError) throw new Error("Unable to load storefronts.");

  const adminOrgIds = new Set((memberships ?? []).filter((membership) => membership.role === "admin").map((membership) => membership.organization_id));

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-black/10 bg-white p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-black/45">Your merch stores</p>
            <h1 className="mt-1 text-2xl font-black">Storefronts</h1>
            <p className="mt-2 max-w-3xl text-sm text-black/55">Organization Admins can choose from Creative Ape’s approved saved layouts. Advanced layout design remains private in the Super Admin dashboard.</p>
          </div>
          <p className="text-sm text-black/50">{stores?.length ?? 0} total</p>
        </div>
      </div>

      <div className="grid gap-4">
        {(stores ?? []).map((store) => {
          const currentLayout = (layouts ?? []).find((layout) => layout.id === store.layout_template_id);
          const canChooseLayout = adminOrgIds.has(store.organization_id);
          return (
            <section key={store.id} className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">{store.title || store.name}</h2>
                  <p className="mt-1 font-mono text-xs text-black/45">/shop/{store.slug}</p>
                  <p className="mt-2 text-xs text-black/45">
                    {store.status} · {store.availability_status}
                    {store.ends_at ? ` · ends ${new Date(store.ends_at).toLocaleDateString()}` : " · no end date"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{currentLayout?.name ?? "Custom / legacy layout"}</span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {store.status === "published" ? (
                  <Link href={`/shop/${store.slug}`} target="_blank" className="portal-open-storefront rounded-xl bg-black px-4 py-2.5 text-sm font-bold">Open storefront</Link>
                ) : (
                  <span className="text-sm text-black/45">This storefront is not published yet.</span>
                )}
              </div>

              {canChooseLayout ? (
                <div className="mt-6 border-t border-black/10 pt-5">
                  <h3 className="font-black">Choose approved layout</h3>
                  <p className="mt-1 text-sm text-black/50">Changing layouts replaces page/section structure and theme, but does not delete products, orders, or reporting history.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(layouts ?? []).map((layout) => (
                      <form key={layout.id} action={applyOrganizationLayout} className="overflow-hidden rounded-xl border border-black/10">
                        <input type="hidden" name="storeId" value={store.id} />
                        <input type="hidden" name="templateId" value={layout.id} />
                        {layout.preview_image_url ? <img src={layout.preview_image_url} alt="" className="aspect-video w-full object-cover" /> : <div className="aspect-video bg-neutral-100" />}
                        <div className="p-4">
                          <p className="font-black">{layout.name}</p>
                          {layout.description ? <p className="mt-1 line-clamp-2 text-xs text-black/50">{layout.description}</p> : null}
                          <button disabled={store.layout_template_id === layout.id} className="mt-3 rounded-lg border border-black/15 px-3 py-2 text-xs font-bold disabled:opacity-40">
                            {store.layout_template_id === layout.id ? "Current layout" : "Use this layout"}
                          </button>
                        </div>
                      </form>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-5 border-t border-black/10 pt-4 text-xs text-black/45">Layout selection is limited to Organization Admins.</p>
              )}
            </section>
          );
        })}
        {!stores?.length ? <p className="rounded-2xl bg-white p-6 text-sm text-black/45">No storefronts are assigned to your organization yet.</p> : null}
      </div>
    </div>
  );
}
