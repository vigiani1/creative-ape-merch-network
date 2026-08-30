import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type ProductLibraryPayload = {
  page?: {
    title: string;
    viewMode: "grid" | "list";
    availableViews?: string[];
  };
  filters?: {
    count?: number;
    organizations?: Array<{ id: string; name: string; count: number }>;
    stores?: Array<{ id: string; name: string; count: number }>;
    categories?: Array<{ id: string; name: string; slug: string; count: number }>;
    statuses?: Array<{ value: string; label: string; count: number }>;
  };
  results?: {
    items?: Array<{
      id: string;
      name: string;
      categoryName?: string | null;
      priceCents: number;
      status: string;
      imageUrl?: string | null;
      colors?: Array<{ name: string }>;
      sizes?: string[];
      stores?: Array<{ name: string; slug: string; isPrimary?: boolean }>;
      target: string;
    }>;
  };
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const { supabase } = await requireSuperAdmin();

  const viewMode = query.view === "list" ? "list" : "grid";
  const status = typeof query.status === "string" ? query.status : undefined;
  const search = typeof query.q === "string" ? query.q : undefined;

  const { data, error } = await supabase.rpc("get_admin_product_library_page_v1", {
    target_organization_id: undefined,
    target_store_id: undefined,
    target_category_id: undefined,
    target_status: status,
    search_query: search,
    view_mode: viewMode,
    result_limit: 100,
    result_offset: 0,
  });

  if (error) throw new Error("Unable to load Product Library.");

  const library = data as ProductLibraryPayload | null;
  const items = library?.results?.items ?? [];

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p className="admin-kicker">Catalog</p>
          <h2>Products</h2>
          <p>{library?.filters?.count ?? items.length} products across your stores.</p>
        </div>
        <Link href="/admin/products/new" className="admin-primary-action">Add Product</Link>
      </section>

      <section className="admin-product-toolbar">
        <form className="admin-search" action="/admin/products">
          <input name="q" type="search" defaultValue={search} placeholder="Search products" />
          {viewMode !== "grid" ? <input type="hidden" name="view" value={viewMode} /> : null}
          <button type="submit">Search</button>
        </form>

        <div className="admin-filter-row">
          <a href="/admin/products" className={!status ? "is-active" : ""}>All</a>
          {(library?.filters?.statuses ?? []).map((item) => (
            <a
              key={item.value}
              href={`/admin/products?status=${item.value}${viewMode === "list" ? "&view=list" : ""}`}
              className={status === item.value ? "is-active" : ""}
            >
              {item.label} <span>{item.count}</span>
            </a>
          ))}
        </div>

        <div className="admin-view-toggle">
          <a href="/admin/products?view=grid" className={viewMode === "grid" ? "is-active" : ""}>Grid</a>
          <a href="/admin/products?view=list" className={viewMode === "list" ? "is-active" : ""}>List</a>
        </div>
      </section>

      {viewMode === "grid" ? (
        <section className="admin-product-grid">
          {items.map((product) => (
            <Link href={product.target} key={product.id} className="admin-product-card">
              <div className="admin-product-card__media">
                {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <div><span>Creative Ape</span></div>}
                <span className={`admin-status admin-status--${product.status}`}>{product.status}</span>
              </div>
              <div className="admin-product-card__body">
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.categoryName || "Uncategorized"}</p>
                </div>
                <strong>{money(product.priceCents)}</strong>
              </div>
              <div className="admin-product-card__meta">
                <span>{product.sizes?.length ?? 0} sizes</span>
                <span>{product.colors?.length ?? 0} colors</span>
                <span>{product.stores?.[0]?.name || "No store"}</span>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Store</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((product) => (
                <tr key={product.id}>
                  <td><Link href={product.target}>{product.name}</Link></td>
                  <td>{product.categoryName || "—"}</td>
                  <td>{product.stores?.[0]?.name || "—"}</td>
                  <td>{money(product.priceCents)}</td>
                  <td><span className={`admin-status admin-status--${product.status}`}>{product.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {!items.length ? (
        <div className="admin-empty admin-empty--large">
          <h3>No products found.</h3>
          <p>Try another search or add a new product.</p>
        </div>
      ) : null}
    </div>
  );
}
