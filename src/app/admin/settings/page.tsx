import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { updateDomainStatus } from "./actions";

type DomainRequest = {
  id:string;
  organizationName:string;
  storeName:string;
  storeSlug:string;
  hostname:string;
  status:string;
  verificationMessage?:string|null;
  requestedAt?:string|null;
};

type PayoutRow = {
  organizationId:string;
  organizationName:string;
  method:string;
  displayLabel:string;
  status:string;
  submittedAt?:string|null;
  verifiedAt?:string|null;
};

export default async function SettingsPage() {
  const { supabase } = await requireSuperAdmin();

  const [
    { count: organizationCount },
    { count: storeCount },
    { count: productCount },
    { data: domainData, error: domainError },
    { data: payoutData, error: payoutError },
  ] = await Promise.all([
    supabase.from("organizations").select("*",{count:"exact",head:true}).neq("status","archived"),
    supabase.from("stores").select("*",{count:"exact",head:true}).neq("status","archived"),
    supabase.from("products").select("*",{count:"exact",head:true}).neq("status","archived"),
    supabase.rpc("get_super_admin_domain_requests_v1"),
    supabase.rpc("get_super_admin_payout_settings_v1"),
  ]);

  if (domainError || payoutError) throw new Error("Unable to load Admin Settings.");

  const domains=(domainData ?? []) as DomainRequest[];
  const payouts=(payoutData ?? []) as PayoutRow[];

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p className="admin-kicker">System</p>
          <h2>Admin Settings</h2>
          <p>Platform-level domain, payout, shipping, and commerce configuration.</p>
        </div>
      </section>

      <section className="admin-settings-summary">
        <article><span>Organizations</span><strong>{organizationCount ?? 0}</strong></article>
        <article><span>Stores</span><strong>{storeCount ?? 0}</strong></article>
        <article><span>Products</span><strong>{productCount ?? 0}</strong></article>
      </section>

      <section className="admin-settings-detail">
        <div className="admin-settings-detail__head">
          <div>
            <p className="admin-kicker">Custom Domains</p>
            <h3>Domain requests</h3>
            <p>Organization admins submit the hostname. Creative Ape connects and verifies the domain.</p>
          </div>
          <a href="https://www.namecheap.com/domains/" target="_blank" rel="noreferrer" className="admin-secondary-action">
            Namecheap ↗
          </a>
        </div>

        <div className="admin-domain-admin-list">
          {domains.map((domain)=>(
            <article key={domain.id} className="admin-domain-admin-row">
              <div>
                <strong>{domain.hostname}</strong>
                <span>{domain.organizationName} · {domain.storeName}</span>
              </div>
              <span className={`admin-status admin-status--${domain.status}`}>{domain.status}</span>
              <form action={updateDomainStatus} className="admin-domain-status-form">
                <input type="hidden" name="domainId" value={domain.id}/>
                <select name="status" defaultValue={domain.status}>
                  <option value="pending">Pending</option>
                  <option value="dns_required">DNS required</option>
                  <option value="verifying">Verifying</option>
                  <option value="active">Active</option>
                  <option value="error">Error</option>
                  <option value="removed">Removed</option>
                </select>
                <input
                  name="message"
                  defaultValue={domain.verificationMessage || ""}
                  placeholder="DNS or verification note"
                />
                <button>Save</button>
              </form>
            </article>
          ))}
          {!domains.length ? <div className="admin-empty">No domain requests yet.</div> : null}
        </div>
      </section>

      <section className="admin-settings-detail">
        <div className="admin-settings-detail__head">
          <div>
            <p className="admin-kicker">Revenue Share</p>
            <h3>Organization payout instructions</h3>
            <p>Only safe labels are shown here. Full payout details stay encrypted until a Super Admin deliberately reveals them.</p>
          </div>
        </div>

        <div className="admin-payout-admin-list">
          {payouts.map((payout)=>(
            <article key={payout.organizationId} className="admin-payout-admin-row">
              <div>
                <strong>{payout.organizationName}</strong>
                <span>{payout.displayLabel}</span>
              </div>
              <div>
                <span className={`admin-status admin-status--${payout.status}`}>{payout.status}</span>
                <small>{payout.submittedAt ? new Date(payout.submittedAt).toLocaleDateString() : ""}</small>
              </div>
              <Link href={`/admin/settings/payouts/${payout.organizationId}`} className="admin-secondary-action">
                Reveal Secure Details
              </Link>
            </article>
          ))}
          {!payouts.length ? <div className="admin-empty">No payout instructions submitted yet.</div> : null}
        </div>
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
          <p className="admin-kicker">Shipping</p>
          <h3>Shipping provider</h3>
          <p>Carrier API credentials, origin address, packaging, live rates, and label generation will live here next.</p>
          <span className="admin-muted">Next implementation phase</span>
        </article>
      </section>

      <aside className="admin-settings-note">
        <p className="admin-kicker">Security</p>
        <h3>Secrets stay backstage.</h3>
        <p>
          Organization payout details are stored in Supabase Vault. Organization admins can replace them but cannot read them back.
          Only Super Admin can use the secure reveal flow.
        </p>
      </aside>
    </div>
  );
}
