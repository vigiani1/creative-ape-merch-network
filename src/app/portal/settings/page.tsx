import { saveCustomDomain, savePayoutDetails } from "./actions";
import { requireOrganizationMembership } from "@/lib/auth";

type SettingsPayload = {
  organization?: { id:string; name:string };
  stores?: Array<{
    id:string;
    name:string;
    slug:string;
    domain?: {
      hostname:string;
      status:string;
      verificationMessage?:string|null;
    } | null;
  }>;
  payout?: {
    method:string;
    displayLabel:string;
    status:string;
    submittedAt?:string|null;
    updatedAt?:string|null;
  } | null;
};

export default async function PortalSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const query = await searchParams;
  const { supabase, memberships } = await requireOrganizationMembership();
  const adminOrgIds = memberships.filter((membership) => membership.role === "admin").map((membership) => membership.organization_id);

  const selectedOrgId =
    typeof query.organization === "string" && adminOrgIds.includes(query.organization)
      ? query.organization
      : adminOrgIds[0];

  if (!selectedOrgId) {
    return (
      <div className="admin-page">
        <section className="admin-page-head">
          <div>
            <p className="admin-kicker">Organization</p>
            <h2>Admin Settings</h2>
            <p>These settings are available to Organization Admins.</p>
          </div>
        </section>
        <div className="admin-empty admin-empty--large">
          <h3>Admin access required.</h3>
        </div>
      </div>
    );
  }

  const { data, error } = await supabase.rpc("get_organization_admin_settings_v1", {
    target_organization_id: selectedOrgId,
  });

  if (error) throw new Error("Unable to load organization settings.");

  const settings = (data ?? {}) as SettingsPayload;
  const saved = typeof query.saved === "string" ? query.saved : null;

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p className="admin-kicker">Organization</p>
          <h2>Admin Settings</h2>
          <p>Custom storefront domain and secure payout instructions for your organization.</p>
        </div>
      </section>

      {saved ? (
        <div className="admin-save-success" role="status">
          <strong>{saved === "domain" ? "Domain request saved." : "Payout details saved securely."}</strong>
          <span>{saved === "domain" ? "Creative Ape can now review and connect the domain." : "The full payout details are encrypted and cannot be displayed back here."}</span>
        </div>
      ) : null}

      {adminOrgIds.length > 1 ? (
        <section className="admin-settings-org-switcher">
          {adminOrgIds.map((id) => (
            <a
              key={id}
              href={`/portal/settings?organization=${id}`}
              className={id === selectedOrgId ? "is-active" : ""}
            >
              {id === selectedOrgId ? settings.organization?.name || "Organization" : "Organization"}
            </a>
          ))}
        </section>
      ) : null}

      <section className="admin-settings-detail">
        <div className="admin-settings-detail__head">
          <div>
            <p className="admin-kicker">Custom Domain</p>
            <h3>Use your own web address</h3>
            <p>The custom domain opens the customer-facing microsite only. Admin and organization tools remain on Creative Ape.</p>
          </div>
          <a
            href="https://www.namecheap.com/domains/"
            target="_blank"
            rel="noreferrer"
            className="admin-secondary-action"
          >
            Buy a Domain at Namecheap ↗
          </a>
        </div>

        <div className="admin-domain-list">
          {(settings.stores ?? []).map((store) => (
            <article key={store.id} className="admin-domain-row">
              <div>
                <strong>{store.name}</strong>
                <span>/shop/{store.slug}</span>
              </div>

              {store.domain ? (
                <div className="admin-domain-current">
                  <strong>{store.domain.hostname}</strong>
                  <span className={`admin-status admin-status--${store.domain.status}`}>{store.domain.status}</span>
                  {store.domain.verificationMessage ? <small>{store.domain.verificationMessage}</small> : null}
                </div>
              ) : null}

              <form action={saveCustomDomain} className="admin-domain-form">
                <input type="hidden" name="organizationId" value={selectedOrgId} />
                <input type="hidden" name="storeId" value={store.id} />
                <label className="admin-field">
                  <span>{store.domain ? "Replace domain request" : "Custom domain"}</span>
                  <input
                    name="hostname"
                    required
                    placeholder="shop.example.com"
                    defaultValue={store.domain?.hostname || ""}
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </label>
                <button className="admin-primary-action">Submit Domain</button>
              </form>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-settings-detail">
        <div className="admin-settings-detail__head">
          <div>
            <p className="admin-kicker">Revenue Share</p>
            <h3>Payout Details</h3>
            <p>Tell Creative Ape where to send your organization’s share of sales.</p>
          </div>
          {settings.payout ? (
            <div className="admin-payout-summary">
              <strong>{settings.payout.displayLabel}</strong>
              <span className={`admin-status admin-status--${settings.payout.status}`}>{settings.payout.status}</span>
            </div>
          ) : null}
        </div>

        <div className="admin-security-note">
          <strong>Encrypted storage</strong>
          <p>
            Saved payout details are encrypted in Supabase Vault. This page will never display your full saved bank or payout credentials again.
            Creative Ape Super Admin is the only role allowed to reveal the encrypted details.
          </p>
          <p>Never enter an online-banking username, password, debit-card PIN, or Social Security number here.</p>
        </div>

        <div className="admin-payout-methods">
          <form action={savePayoutDetails} className="admin-payout-card">
            <input type="hidden" name="organizationId" value={selectedOrgId} />
            <input type="hidden" name="payoutMethod" value="ach" />
            <div>
              <p className="admin-kicker">ACH</p>
              <h4>Bank Transfer</h4>
            </div>
            <label className="admin-field"><span>Account holder name</span><input name="accountHolderName" required autoComplete="off" /></label>
            <label className="admin-field"><span>Account type</span><select name="accountType" defaultValue="checking"><option value="checking">Checking</option><option value="savings">Savings</option></select></label>
            <label className="admin-field"><span>Routing number</span><input name="routingNumber" inputMode="numeric" required autoComplete="off" /></label>
            <label className="admin-field"><span>Account number</span><input name="accountNumber" inputMode="numeric" required autoComplete="off" /></label>
            <button className="admin-primary-action">Save Bank Details</button>
          </form>

          <form action={savePayoutDetails} className="admin-payout-card">
            <input type="hidden" name="organizationId" value={selectedOrgId} />
            <input type="hidden" name="payoutMethod" value="paypal" />
            <div>
              <p className="admin-kicker">PayPal</p>
              <h4>PayPal Payout</h4>
            </div>
            <label className="admin-field"><span>PayPal email</span><input name="paypalEmail" type="email" required autoComplete="off" /></label>
            <button className="admin-primary-action">Save PayPal Details</button>
          </form>

          <form action={savePayoutDetails} className="admin-payout-card">
            <input type="hidden" name="organizationId" value={selectedOrgId} />
            <input type="hidden" name="payoutMethod" value="zelle" />
            <div>
              <p className="admin-kicker">Zelle</p>
              <h4>Zelle Payout</h4>
            </div>
            <label className="admin-field"><span>Zelle email</span><input name="zelleEmail" type="email" autoComplete="off" /></label>
            <label className="admin-field"><span>Or phone number</span><input name="zellePhone" type="tel" autoComplete="off" /></label>
            <button className="admin-primary-action">Save Zelle Details</button>
          </form>
        </div>
      </section>
    </div>
  );
}
