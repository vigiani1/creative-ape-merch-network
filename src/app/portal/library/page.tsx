import { requireOrganizationMembership } from "@/lib/auth";

type Search = { q?: string; category?: string };


function metadataVariants(value: unknown): unknown[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const variants = (value as Record<string, unknown>).variants;
  return Array.isArray(variants) ? variants : [];
}
export default async function PortalProductLibraryPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const category = (params.category ?? "").trim();

  const { supabase, organizationIds } = await requireOrganizationMembership();

  const { data: categoryRows, error: categoryError } = await supabase
    .from("organization_product_library")
    .select("category")
    .in("organization_id", organizationIds)
    .not("category","is",null);

  if (categoryError) throw new Error("Unable to load product library filters.");

  let query = supabase
    .from("organization_product_library")
    .select("id,organization_id,name,category,description,status,search_metadata,organizations(name,organization_number),stores(name)")
    .in("organization_id", organizationIds)
    .order("category")
    .order("name");

  if (q) query = query.ilike("search_text", `%${q}%`);
  if (category) query = query.eq("category", category);

  const { data: items, error } = await query;
  if (error) throw new Error("Unable to load product library.");

  const categories = [...new Set((categoryRows ?? []).map((row) => row.category).filter((value): value is string => Boolean(value)))].sort();

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-black/45">Organization catalog</p>
        <h1 className="mt-1 text-3xl font-black">Product library</h1>
        <p className="mt-2 text-sm text-black/55">Products available to your organization, organized by category. Internal vendor and Creative Ape cost information is not exposed here.</p>
      </div>

      <form method="get" className="grid gap-3 rounded-2xl border border-black/10 bg-white p-5 md:grid-cols-[1.5fr_1fr_auto]">
        <input name="q" defaultValue={params.q ?? ""} placeholder="Search products..." className="rounded-xl border border-black/15 px-4 py-3" />
        <select name="category" defaultValue={category} className="rounded-xl border border-black/15 px-4 py-3">
          <option value="">All categories</option>
          {categories.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <button className="rounded-xl bg-black px-5 py-3 font-bold text-white">Search</button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(items ?? []).map((item) => {
          const org = Array.isArray(item.organizations) ? item.organizations[0] : item.organizations;
          const store = Array.isArray(item.stores) ? item.stores[0] : item.stores;
          const variants = metadataVariants(item.search_metadata);
          return (
            <article key={item.id} className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-black/40">CA-{String(org?.organization_number ?? 0).padStart(6,"0")}</p>
                  <h2 className="mt-1 text-xl font-black">{item.name}</h2>
                  <p className="mt-1 text-sm text-black/45">{item.category || "Uncategorized"}</p>
                </div>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black uppercase">{item.status}</span>
              </div>
              {item.description ? <p className="mt-4 text-sm text-black/60">{item.description}</p> : null}
              <div className="mt-4 grid gap-1 text-sm">
                <p><span className="font-semibold">Store:</span> {store?.name ?? "Not assigned yet"}</p>
                <p><span className="font-semibold">Variants:</span> {variants.length}</p>
              </div>
            </article>
          );
        })}
      </div>

      {!items?.length ? <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center text-black/45">No products matched that search.</div> : null}
    </div>
  );
}
