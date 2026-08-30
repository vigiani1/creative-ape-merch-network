import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { saveShippingSettings, updateDomainStatus } from "./actions";

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

type ShippingSettings = {
  provider?: string;
  hasApiKey?: boolean;
  connectionStatus?: string;
  origin?: {
    name?: string|null;
    company?: string|null;
    phone?: string|null;
    email?: string|null;
    address1?: string|null;
    address2?: string|null;
    city?: string|null;
    state?: string|null;
    postalCode?: string|null;
    country?: string|null;
  };
  package?: {
    name?: string|null;
    length?: number|null;
    width?: number|null;
    height?: number|null;
    weightOz?: number|null;
  };
  rules?: {
    freeShippingThresholdCents?: number|null;
    handlingFeeCents?: number|null;
    fallbackRateCents?: number|null;
    allowedServices?: string[];
  };
};

export default async function SettingsPage() {
  const { supabase } = await requireSuperAdmin();

  const [
    { count: organizationCount },
    { count: storeCount },
    { count: productCount },
    { data: domainData, error: domainError },
    { data: payoutData, error: payoutError },
    { data: shippingData, error: shippingError },
  ] = await Promise.all([
    supabase.from("organizations").select("*",{count:"exact",head:true}).neq("status","archived"),
    supabase.from("stores").select("*",{count:"exact",head:true}).neq("status","archived"),
    supabase.from("products").select("*",{count:"exact",head:true}).neq("status","archived"),
    supabase.rpc("get_super_admin_domain_requests_v1"),
    supabase.rpc("get_super_admin_payout_settings_v1"),
    supabase.rpc("get_super_admin_shipping_settings_v1"),
  ]);

  if (domainError || payoutError || shippingError) throw new Error("Unable to load Admin Settings.");

  const domains=(domainData ?? []) as DomainRequest[];
  const payouts=(payoutData ?? []) as PayoutRow[];
  const shipping=(shippingData ?? {}) as ShippingSettings;
  const allowedServices=new Set(shipping.rules?.allowedServices ?? []);

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

      <section className="admin-settings-detail">
        <div className="admin-settings-detail__head">
          <div>
            <p className="admin-kicker">Shipping</p>
            <h3>Shipping Provider</h3>
            <p>Creative Ape controls carrier credentials, origin, package defaults, and checkout shipping rules.</p>
          </div>
          <div className="admin-payout-summary">
            <strong>{shipping.provider ? shipping.provider.toUpperCase() : "Not configured"}</strong>
            <span className={`admin-status admin-status--${shipping.connectionStatus || "not_configured"}`}>
              {shipping.connectionStatus || "not configured"}
            </span>
          </div>
        </div>

        <form action={saveShippingSettings} className="admin-shipping-form">
          <section className="admin-shipping-block">
            <div className="admin-shipping-block__head">
              <span>01</span>
              <div>
                <h4>Provider Connection</h4>
                <p>The API key is encrypted in Supabase Vault and is never displayed back after saving.</p>
              </div>
            </div>
            <div className="admin-editor-fields admin-editor-fields--two">
              <label className="admin-field">
                <span>Shipping provider</span>
                <select name="provider" defaultValue={shipping.provider || "manual"}>
                  <option value="manual">Manual / fallback rates</option>
                  <option value="shippo">Shippo</option>
                  <option value="easypost">EasyPost</option>
                  <option value="shipengine">ShipEngine</option>
                </select>
              </label>
              <label className="admin-field">
                <span>API key {shipping.hasApiKey ? <em>Saved securely</em> : null}</span>
                <input
                  name="apiKey"
                  type="password"
                  autoComplete="new-password"
                  placeholder={shipping.hasApiKey ? "Leave blank to keep current key" : "Enter provider API key"}
                />
              </label>
            </div>
          </section>

          <section className="admin-shipping-block">
            <div className="admin-shipping-block__head">
              <span>02</span>
              <div>
                <h4>Shipping Origin</h4>
                <p>The return-from address used to calculate live carrier rates and labels.</p>
              </div>
            </div>
            <div className="admin-editor-fields admin-editor-fields--two">
              <label className="admin-field"><span>Contact name</span><input name="originName" defaultValue={shipping.origin?.name || ""} /></label>
              <label className="admin-field"><span>Company</span><input name="originCompany" defaultValue={shipping.origin?.company || ""} /></label>
              <label className="admin-field"><span>Phone</span><input name="originPhone" type="tel" defaultValue={shipping.origin?.phone || ""} /></label>
              <label className="admin-field"><span>Email</span><input name="originEmail" type="email" defaultValue={shipping.origin?.email || ""} /></label>
              <label className="admin-field admin-field--wide"><span>Address</span><input name="originAddress1" defaultValue={shipping.origin?.address1 || ""} /></label>
              <label className="admin-field admin-field--wide"><span>Address line 2</span><input name="originAddress2" defaultValue={shipping.origin?.address2 || ""} /></label>
              <label className="admin-field"><span>City</span><input name="originCity" defaultValue={shipping.origin?.city || ""} /></label>
              <label className="admin-field"><span>State</span><input name="originState" defaultValue={shipping.origin?.state || ""} /></label>
              <label className="admin-field"><span>ZIP code</span><input name="originPostalCode" defaultValue={shipping.origin?.postalCode || ""} /></label>
              <label className="admin-field"><span>Country</span><input name="originCountry" defaultValue={shipping.origin?.country || "US"} /></label>
            </div>
          </section>

          <section className="admin-shipping-block">
            <div className="admin-shipping-block__head">
              <span>03</span>
              <div>
                <h4>Default Package</h4>
                <p>Fallback parcel dimensions for apparel orders when a product-specific package is not defined.</p>
              </div>
            </div>
            <div className="admin-editor-fields admin-editor-fields--five">
              <label className="admin-field admin-field--wide"><span>Package name</span><input name="packageName" defaultValue={shipping.package?.name || "Apparel Mailer"} /></label>
              <label className="admin-field"><span>Length (in)</span><input name="packageLength" type="number" min="0.01" step="0.01" defaultValue={shipping.package?.length ?? 12} /></label>
              <label className="admin-field"><span>Width (in)</span><input name="packageWidth" type="number" min="0.01" step="0.01" defaultValue={shipping.package?.width ?? 10} /></label>
              <label className="admin-field"><span>Height (in)</span><input name="packageHeight" type="number" min="0.01" step="0.01" defaultValue={shipping.package?.height ?? 2} /></label>
              <label className="admin-field"><span>Weight (oz)</span><input name="packageWeightOz" type="number" min="0.01" step="0.01" defaultValue={shipping.package?.weightOz ?? 8} /></label>
            </div>
          </section>

          <section className="admin-shipping-block">
            <div className="admin-shipping-block__head">
              <span>04</span>
              <div>
                <h4>Checkout Rules</h4>
                <p>Control free shipping, handling, fallback pricing, and which carrier services customers may choose.</p>
              </div>
            </div>
            <div className="admin-editor-fields admin-editor-fields--three">
              <label className="admin-field">
                <span>Free shipping over</span>
                <div className="admin-money-input"><b>$</b><input name="freeShippingThreshold" type="number" min="0" step="0.01" defaultValue={shipping.rules?.freeShippingThresholdCents == null ? "" : (shipping.rules.freeShippingThresholdCents/100).toFixed(2)} placeholder="75.00" /></div>
              </label>
              <label className="admin-field">
                <span>Handling fee</span>
                <div className="admin-money-input"><b>$</b><input name="handlingFee" type="number" min="0" step="0.01" defaultValue={((shipping.rules?.handlingFeeCents ?? 0)/100).toFixed(2)} /></div>
              </label>
              <label className="admin-field">
                <span>Fallback shipping rate</span>
                <div className="admin-money-input"><b>$</b><input name="fallbackRate" type="number" min="0" step="0.01" defaultValue={((shipping.rules?.fallbackRateCents ?? 895)/100).toFixed(2)} /></div>
              </label>
            </div>

            <div className="admin-shipping-services">
              <p>Allowed services</p>
              {[
                ["usps_ground_advantage","USPS Ground Advantage"],
                ["usps_priority","USPS Priority Mail"],
                ["ups_ground","UPS Ground"],
                ["ups_2day","UPS 2nd Day Air"],
                ["fedex_ground","FedEx Ground"],
              ].map(([value,label])=>(
                <label key={value}>
                  <input type="checkbox" name="allowedServices" value={value} defaultChecked={allowedServices.has(value)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="admin-editor-savebar">
            <span className="admin-muted">Provider secrets are never returned to the browser after save.</span>
            <button type="submit">Save Shipping Settings</button>
          </div>
        </form>
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
          <h3>Checkout shipping</h3>
          <p>The provider connection and shipping rules above now define the policy that checkout will consume.</p>
          <span className="admin-muted">Live rate + label execution is the next carrier-integration layer.</span>
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
