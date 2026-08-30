import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";

export default async function SettingsPage() {
  const { supabase } = await requireSuperAdmin();

  const [
    { count: organizationCount },
    { count: storeCount },
    { count: productCount },
  ] = await Promise.all([
    supabase.from("organizations").select("*",{count:"exact",head:true}).neq("status","archived"),
    supabase.from("stores").select("*",{count:"exact",head:true}).neq("status","archived"),
    supabase.from("products").select("*",{count:"exact",head:true}).neq("status","archived"),
  ]);

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p className="admin-kicker">System</p>
          <h2>Settings</h2>
          <p>High-level network configuration and links to the places where day-to-day settings actually live.</p>
        </div>
      </section>

      <section className="admin-settings-summary">
        <article>
          <span>Organizations</span>
          <strong>{organizationCount ?? 0}</strong>
        </article>
        <article>
          <span>Stores</span>
          <strong>{storeCount ?? 0}</strong>
        </article>
        <article>
          <span>Products</span>
          <strong>{productCount ?? 0}</strong>
        </article>
      </section>

      <section className="admin-settings-grid">
        <article className="admin-settings-card">
          <p className="admin-kicker">Catalog</p>
          <h3>Product structure</h3>
          <p>Manage product types, Size/Color behavior, and merchandising collections.</p>
          <Link href="/admin/products/taxonomy">Categories & Collections →</Link>
        </article>

        <article className="admin-settings-card">
          <p className="admin-kicker">Storefront</p>
          <h3>Store design</h3>
          <p>Branding, navigation, homepage structure, and commerce presentation live here.</p>
          <Link href="/admin/store-design">Store Design →</Link>
        </article>

        <article className="admin-settings-card">
          <p className="admin-kicker">Assets</p>
          <h3>Media library</h3>
          <p>Central source for logos, product photography, campaign artwork, video, and PDFs.</p>
          <Link href="/admin/media">Media →</Link>
        </article>

        <article className="admin-settings-card">
          <p className="admin-kicker">Commerce</p>
          <h3>Orders & fulfillment</h3>
          <p>Payment and fulfillment work stays attached to the order workflow rather than becoming a separate admin maze.</p>
          <Link href="/admin/orders">Orders →</Link>
        </article>
      </section>

      <aside className="admin-settings-note">
        <p className="admin-kicker">Architecture guardrail</p>
        <h3>Keep complexity backstage.</h3>
        <p>
          This settings area intentionally does not expose database IDs, internal sellable-combination tables, service credentials, or legacy option-editor controls.
          Those remain implementation details unless a real operational requirement calls for them.
        </p>
      </aside>
    </div>
  );
}
