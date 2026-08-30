import Link from "next/link";
import { createOrganization } from "./actions";
import { requireSuperAdmin } from "@/lib/auth";

type Organization = {
  id: string;
  number?: number | null;
  name: string;
  slug: string;
  type: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  status: string;
  storeCount: number;
  productCount: number;
  orderCount: number;
};

function titleCase(value: string) {
  return value.replaceAll("_"," ").replace(/\b\w/g,(letter)=>letter.toUpperCase());
}

export default async function OrganizationsPage() {
  const { supabase } = await requireSuperAdmin();
  const { data, error } = await supabase.rpc("get_admin_organizations_v1", { search_query: undefined });

  if (error) throw new Error("Unable to load organizations.");

  const organizations=(data ?? []) as Organization[];

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p className="admin-kicker">Network</p>
          <h2>Organizations</h2>
          <p>Schools, teams, businesses, clubs, events, and other storefront owners.</p>
        </div>
      </section>

      <div className="admin-split-layout">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <p className="admin-kicker">Directory</p>
              <h3>{organizations.length} organizations</h3>
            </div>
          </div>

          <div className="admin-entity-list">
            {organizations.map((org)=>(
              <Link key={org.id} href={`/admin/organizations/${org.id}`} className="admin-entity-row">
                <div className="admin-entity-row__identity">
                  <strong>{org.name}</strong>
                  <span>{org.slug}</span>
                </div>
                <div><span>Type</span><strong>{titleCase(org.type)}</strong></div>
                <div><span>Stores</span><strong>{org.storeCount}</strong></div>
                <div><span>Products</span><strong>{org.productCount}</strong></div>
                <div><span>Orders</span><strong>{org.orderCount}</strong></div>
                <span className={`admin-status admin-status--${org.status}`}>{org.status}</span>
              </Link>
            ))}
            {!organizations.length ? <div className="admin-empty">No organizations yet.</div> : null}
          </div>
        </section>

        <aside className="admin-panel admin-create-panel">
          <div className="admin-panel__head">
            <div>
              <p className="admin-kicker">New</p>
              <h3>Create organization</h3>
            </div>
          </div>
          <form action={createOrganization} className="admin-create-form">
            <label className="admin-field"><span>Name</span><input name="name" required minLength={2} maxLength={120} placeholder="Example High School" /></label>
            <label className="admin-field"><span>Slug</span><input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} placeholder="example-high-school" /></label>
            <label className="admin-field"><span>Type</span><select name="organizationType" defaultValue="business"><option value="business">Business</option><option value="school">School</option><option value="sports_team">Sports team</option><option value="club">Club</option><option value="nonprofit">Nonprofit</option><option value="event">Event</option><option value="other">Other</option></select></label>
            <label className="admin-field"><span>Default revenue share %</span><input name="revenueShareRate" type="number" min="0" max="100" step="0.01" defaultValue="20" required /></label>
            <button type="submit" className="admin-primary-action">Create Organization</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
