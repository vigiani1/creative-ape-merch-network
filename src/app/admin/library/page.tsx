import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";

type Search = { q?: string; category?: string; organization?: string };

export default async function AdminProductLibraryPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const category = (params.category ?? "").trim();
  const organization = (params.organization ?? "").trim();

  const { supabase } = await requireSuperAdmin();

  const [
    { data: organizations, error: orgError },
    { data: categoryRows, error: categoryError },
  ] = await Promise.all([
    supabase.from("organizations").select("id,name,organization_number").order("name"),
    supabase.from("organization_product_library").select("category").not("category","is",null),
  ]);

  if (orgError || categoryError) throw new Error("Unable to load product library filters.");

  let query = supabase
    .from("organization_product_library")
    .select("id,organization_id,source_product_id,name,category,sku,vendor_part_number,description,status,search_metadata,organizations(name,organization_number),vendors(name),stores(name)")
    .order("organization_id")
    .order("category")
    .order("name");

  if (q) query = query.ilike("search_text", `%${q}%`);
  if (category) query = query.eq("category", category);
  if (organization) query = query.eq("organization_id", organization);

  const { data: items, error } = await query;
  if (error) throw new Error("Unable to load product library.");

  const categories = [...new Set((categoryRows ?? []).map((row) => row.category).filter((value): value is string => Boolean(value)))].sort();

  const groups = new Map<string, { orgName: string; orgNumber: number; categories: Map<string, typeof items> }>();
  for (const item of items ?? []) {
    const org = Array.isArray(item.organizations) ? item.organizations[0] : item.organizations;
    const orgName = org?.name ?? "Unknown organization";
    const orgNumber = Number(org?.organization_number ?? 0);
    const key = item.organization_id;
    if (!groups.has(key)) groups.set(key, { orgName, orgNumber, categories: new Map() });
    const categoryName = item.category || "Uncategorized";
    const cat = groups.get(key)!.categories;
    const list = cat.get(categoryName) ?? [];
    list.push(item);
    cat.set(categoryName, list);
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-black/45">Master catalog</p>
        <h1 className="mt-1 text-3xl font-black">Product library</h1>
        <p className="mt-2 max-w-4xl text-sm text-black/55">Search across organization products by name, category, SKU, vendor part number, description, and variant-specific data such as size, color, variant SKU, packaging class, and availability.</p>
      </div>

      <form method="get" className="grid gap-3 rounded-2xl border border-black/10 bg-white p-5 md:grid-cols-[1.5fr_1fr_1fr_auto]">
        <input name="q" defaultValue={params.q ?? ""} placeholder="Search name, part #, SKU, size, color..." className="rounded-xl border border-black/15 px-4 py-3" />
        <select name="organization" defaultValue={organization} className="rounded-xl border border-black/15 px-4 py-3">
          <option value="">All organizations</option>
          {(organizations ?? []).map((org) => <option key={org.id} value={org.id}>CA-{String(org.organization_number).padStart(6,"0")} · {org.name}</option>)}
        </select>
        <select name="category" defaultValue={category} className="rounded-xl border border-black/15 px-4 py-3">
          <option value="">All categories</option>
          {categories.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <button className="rounded-xl bg-black px-5 py-3 font-bold text-white">Search</button>
      </form>

      {[...groups.entries()].map(([orgId, group]) => (
        <section key={orgId} className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-black/40">CA-{String(group.orgNumber).padStart(6,"0")}</p>
              <h2 className="mt-1 text-2xl font-black">{group.orgName}</h2>
            </div>
            <Link href={`/admin/organizations/${orgId}`} className="text-sm font-semibold underline">Open organization</Link>
          </div>

          <div className="mt-6 grid gap-6">
            {[...group.categories.entries()].map(([categoryName, rows]) => (
              <div key={categoryName}>
                <div className="flex items-center justify-between border-b border-black/10 pb-2">
                  <h3 className="font-black">{categoryName}</h3>
                  <span className="text-xs text-black/45">{rows?.length ?? 0} products</span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {(rows ?? []).map((item) => {
                    const vendor = Array.isArray(item.vendors) ? item.vendors[0] : item.vendors;
                    const store = Array.isArray(item.stores) ? item.stores[0] : item.stores;
                    const variantCount = Array.isArray((item.search_metadata as any)?.variants) ? (item.search_metadata as any).variants.length : 0;
                    return (
                      <article key={item.id} className="rounded-xl border border-black/10 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-black">{item.name}</h4>
                            <p className="mt-1 text-xs text-black/45">{store?.name ?? "Library only"}</p>
                          </div>
                          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black uppercase">{item.status}</span>
                        </div>
                        <div className="mt-4 grid gap-1 text-sm">
                          <p><span className="font-semibold">SKU:</span> {item.sku || "—"}</p>
                          <p><span className="font-semibold">Vendor:</span> {vendor?.name || "—"}</p>
                          <p><span className="font-semibold">Vendor part #:</span> {item.vendor_part_number || "—"}</p>
                          <p><span className="font-semibold">Variants:</span> {variantCount}</p>
                        </div>
                        {item.source_product_id ? <Link href={`/admin/products/${item.source_product_id}`} className="mt-4 inline-block text-sm font-semibold underline">Edit product</Link> : null}
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {!items?.length ? <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center text-black/45">No products matched that search.</div> : null}
    </div>
  );
}
