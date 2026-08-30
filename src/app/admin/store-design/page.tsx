import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";

type StoreRow = {
  id: string;
  name: string;
  organizationName?: string | null;
  status: string;
};

type DesignerPayload = {
  designer?: {
    store?: {
      id: string;
      name: string;
      slug: string;
      title?: string | null;
      description?: string | null;
      status?: string | null;
    };
    theme?: {
      logoUrl?: string | null;
      heroImageUrl?: string | null;
      primaryColor?: string | null;
      secondaryColor?: string | null;
      accentColor?: string | null;
      backgroundColor?: string | null;
      textColor?: string | null;
      headingFontFamily?: string | null;
      bodyFontFamily?: string | null;
      blueprintVersion?: string | null;
    };
    commerce?: {
      currency?: string | null;
      freeShippingThresholdCents?: number | null;
      cartNote?: string | null;
      checkoutButtonLabel?: string | null;
      continueShoppingLabel?: string | null;
    };
    navigation?: Array<{
      id: string;
      label: string;
      type: string;
      target: string;
      position: number;
      enabled: boolean;
    }>;
    homepageSections?: Array<{
      id: string;
      type: string;
      position: number;
      enabled: boolean;
      settings?: Record<string, unknown>;
    }>;
  };
};

export default async function StoreDesignPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const { supabase } = await requireSuperAdmin();

  const { data: storesData, error: storesError } = await supabase.rpc("get_admin_stores_v1", {
    target_organization_id: undefined,
    search_query: undefined,
  });

  if (storesError) throw new Error("Unable to load stores.");

  const stores = (storesData ?? []) as StoreRow[];
  const requestedStoreId = typeof query.store === "string" ? query.store : stores[0]?.id;

  let designer: DesignerPayload | null = null;

  if (requestedStoreId) {
    const { data, error } = await supabase.rpc("get_admin_store_design_page_v1", {
      target_store_id: requestedStoreId,
    });

    if (error) throw new Error("Unable to load Store Design.");
    designer = data as DesignerPayload;
  }

  const model = designer?.designer;

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p className="admin-kicker">Storefront</p>
          <h2>Store Design</h2>
          <p>Manage branding, navigation, homepage content, and commerce settings without changing the structural blueprint.</p>
        </div>
        {model?.store?.slug ? (
          <Link href={`/shop/${model.store.slug}`} target="_blank" className="admin-secondary-action">
            Preview Store ↗
          </Link>
        ) : null}
      </section>

      <section className="admin-store-selector">
        <label className="admin-field">
          <span>Store</span>
          <select defaultValue={requestedStoreId}>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </label>
        <div className="admin-store-selector__links">
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/admin/store-design?store=${store.id}`}
              className={store.id === requestedStoreId ? "is-active" : ""}
            >
              {store.name}
            </Link>
          ))}
        </div>
      </section>

      {model?.store ? (
        <div className="admin-designer-grid">
          <section className="admin-designer-panel">
            <div className="admin-designer-panel__head">
              <p className="admin-kicker">01</p>
              <h3>Branding</h3>
              <p>Store identity and visual tone.</p>
            </div>
            <div className="admin-designer-fields">
              <div><span>Store title</span><strong>{model.store.title || model.store.name}</strong></div>
              <div><span>Logo</span><strong>{model.theme?.logoUrl ? "Configured" : "Not set"}</strong></div>
              <div><span>Hero image</span><strong>{model.theme?.heroImageUrl ? "Configured" : "Not set"}</strong></div>
              <div className="admin-color-preview">
                <span>Brand colors</span>
                <div>
                  {[model.theme?.primaryColor,model.theme?.secondaryColor,model.theme?.accentColor,model.theme?.backgroundColor,model.theme?.textColor]
                    .filter((value): value is string => Boolean(value))
                    .map((value) => <i key={value} style={{ background:value }} title={value} />)}
                </div>
              </div>
              <div><span>Heading font</span><strong>{model.theme?.headingFontFamily || "Default"}</strong></div>
              <div><span>Body font</span><strong>{model.theme?.bodyFontFamily || "Default"}</strong></div>
            </div>
          </section>

          <section className="admin-designer-panel">
            <div className="admin-designer-panel__head">
              <p className="admin-kicker">02</p>
              <h3>Navigation</h3>
              <p>Top-level storefront links.</p>
            </div>
            <div className="admin-designer-list">
              {(model.navigation ?? []).map((item) => (
                <div key={item.id}>
                  <strong>{item.label}</strong>
                  <span>{item.target}</span>
                  <span>{item.enabled ? "Visible" : "Hidden"}</span>
                </div>
              ))}
              {!model.navigation?.length ? <div className="admin-empty">No navigation items.</div> : null}
            </div>
          </section>

          <section className="admin-designer-panel admin-designer-panel--wide">
            <div className="admin-designer-panel__head">
              <p className="admin-kicker">03</p>
              <h3>Homepage</h3>
              <p>Approved editorial-commerce section order.</p>
            </div>
            <div className="admin-section-order">
              {(model.homepageSections ?? []).map((section,index) => (
                <div key={section.id}>
                  <span>{String(index+1).padStart(2,"0")}</span>
                  <strong>{section.type.replaceAll("_"," ")}</strong>
                  <span>{section.enabled ? "Visible" : "Hidden"}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-designer-panel">
            <div className="admin-designer-panel__head">
              <p className="admin-kicker">04</p>
              <h3>Commerce</h3>
              <p>Cart and checkout behavior.</p>
            </div>
            <div className="admin-designer-fields">
              <div><span>Currency</span><strong>{model.commerce?.currency || "USD"}</strong></div>
              <div><span>Free shipping threshold</span><strong>{model.commerce?.freeShippingThresholdCents == null ? "Not set" : `$${(model.commerce.freeShippingThresholdCents/100).toFixed(2)}`}</strong></div>
              <div><span>Checkout label</span><strong>{model.commerce?.checkoutButtonLabel || "Checkout"}</strong></div>
              <div><span>Cart note</span><strong>{model.commerce?.cartNote || "None"}</strong></div>
            </div>
          </section>

          <aside className="admin-designer-lock">
            <p className="admin-kicker">Locked system</p>
            <h3>{model.theme?.blueprintVersion || "editorial_commerce_v1"}</h3>
            <p>The grid, PDP structure, cart drawer pattern, and responsive behavior remain system-controlled to keep stores consistent and conversion-friendly.</p>
          </aside>
        </div>
      ) : (
        <div className="admin-empty admin-empty--large">
          <h3>No store selected.</h3>
        </div>
      )}
    </div>
  );
}
