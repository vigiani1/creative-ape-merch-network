import Link from "next/link";
import { requireOrganizationMembership } from "@/lib/auth";

export default async function PortalStoresPage() {
  const { supabase, organizationIds } = await requireOrganizationMembership();

  const { data: stores, error } = await supabase
    .from("stores")
    .select("id,name,title,slug,status,published_at,organization_id")
    .in("organization_id", organizationIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load storefronts.");

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-black/45">Your merch stores</p>
          <h1 className="mt-1 text-2xl font-black">Storefronts</h1>
        </div>
        <p className="text-sm text-black/50">{stores?.length ?? 0} total</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(stores ?? []).map((store) => (
          <div key={store.id} className="rounded-2xl border border-black/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black">{store.title || store.name}</h2>
                <p className="mt-1 font-mono text-xs text-black/45">/shop/{store.slug}</p>
              </div>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{store.status}</span>
            </div>
            <div className="mt-5 flex items-center gap-3">
              {store.status === "published" ? (
                <Link href={`/shop/${store.slug}`} target="_blank" className="rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white">Open storefront</Link>
              ) : (
                <span className="text-sm text-black/45">This storefront is not published yet.</span>
              )}
            </div>
          </div>
        ))}
        {!stores?.length ? <p className="text-sm text-black/45">No storefronts are assigned to your organization yet.</p> : null}
      </div>
    </div>
  );
}
