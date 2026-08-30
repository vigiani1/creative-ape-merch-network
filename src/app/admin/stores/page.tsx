import Link from "next/link";
import { createStore } from "./actions";
import { requireSuperAdmin } from "@/lib/auth";

type StoreRow = {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  slug: string;
  title?: string | null;
  status: string;
  availabilityStatus?: string | null;
  productCount: number;
};

export default async function StoresPage() {
  const { supabase } = await requireSuperAdmin();

  const [{ data: storesData, error: storeError }, { data: orgData, error: orgError }] = await Promise.all([
    supabase.rpc("get_admin_stores_v1", { target_organization_id: undefined, search_query: undefined }),
    supabase.rpc("get_admin_organizations_v1", { search_query: undefined }),
  ]);

  if (storeError || orgError) throw new Error("Unable to load stores.");

  const stores=(storesData ?? []) as StoreRow[];
  const organizations=(orgData ?? []) as Array<{id:string;name:string;status:string}>;

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p className="admin-kicker">Storefronts</p>
          <h2>Stores</h2>
          <p>Manage storefront ownership, publishing state, product counts, and design access.</p>
        </div>
      </section>

      <div className="admin-split-layout">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <p className="admin-kicker">Directory</p>
              <h3>{stores.length} stores</h3>
            </div>
          </div>

          <div className="admin-store-list">
            {stores.map((store)=>(
              <article key={store.id} className="admin-store-row">
                <div>
                  <strong>{store.title || store.name}</strong>
                  <span>{store.organizationName}</span>
                </div>
                <div><span>Products</span><strong>{store.productCount}</strong></div>
                <div><span>Slug</span><strong>{store.slug}</strong></div>
                <div className="admin-store-row__actions">
                  <span className={`admin-status admin-status--${store.status}`}>{store.status}</span>
                  <Link href={`/admin/store-design?store=${store.id}`}>Design</Link>
                  <Link href={`/admin/stores/${store.id}`}>Manage</Link>
                  {store.status === "published" ? <Link href={`/shop/${store.slug}`} target="_blank">Open ↗</Link> : null}
                </div>
              </article>
            ))}
            {!stores.length ? <div className="admin-empty">No stores yet.</div> : null}
          </div>
        </section>

        <aside className="admin-panel admin-create-panel">
          <div className="admin-panel__head">
            <div>
              <p className="admin-kicker">New</p>
              <h3>Create store</h3>
            </div>
          </div>

          <form action={createStore} className="admin-create-form">
            <label className="admin-field"><span>Organization</span><select name="organizationId" required defaultValue=""><option value="" disabled>Select organization</option>{organizations.filter((org)=>org.status==="active").map((org)=><option key={org.id} value={org.id}>{org.name}</option>)}</select></label>
            <label className="admin-field"><span>Store name</span><input name="name" required minLength={2} maxLength={120} placeholder="Example Spirit Shop" /></label>
            <label className="admin-field"><span>Public slug</span><input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} placeholder="example-spirit-shop" /></label>
            <label className="admin-field"><span>Public title</span><input name="title" maxLength={160} placeholder="Example High School Spirit Shop" /></label>
            <label className="admin-field"><span>Description</span><textarea name="description" rows={4} maxLength={1000} placeholder="Tell customers what this store supports." /></label>
            <label className="admin-field"><span>Initial status</span><select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option></select></label>
            <button type="submit" className="admin-primary-action">Create Store</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
