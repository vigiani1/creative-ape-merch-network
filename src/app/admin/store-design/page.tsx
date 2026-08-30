import Link from "next/link";
import { ImageUploader } from "@/components/admin/image-uploader";
import { requireSuperAdmin } from "@/lib/auth";
import { saveStoreDesign } from "./actions";

type StoreRow = {
  id:string;
  name:string;
  slug?:string|null;
  status:string;
};

type DesignerPayload = {
  designer?: {
    store?: {
      id:string;
      name:string;
      slug:string;
      title?:string|null;
      description?:string|null;
      status?:string|null;
    };
    theme?: {
      logoUrl?:string|null;
      heroImageUrl?:string|null;
      primaryColor?:string|null;
      secondaryColor?:string|null;
      accentColor?:string|null;
      backgroundColor?:string|null;
      textColor?:string|null;
      headingFontFamily?:string|null;
      bodyFontFamily?:string|null;
      blueprintVersion?:string|null;
    };
    commerce?: {
      currency?:string|null;
      freeShippingThresholdCents?:number|null;
      cartNote?:string|null;
      checkoutButtonLabel?:string|null;
      continueShoppingLabel?:string|null;
    };
    navigation?: Array<{id:string;label:string;type:string;target:string;position:number;enabled:boolean}>;
    homepageSections?: Array<{id:string;type:string;position:number;enabled:boolean;settings?:Record<string,unknown>}>;
  };
};

export default async function StoreDesignPage({
  searchParams,
}: {
  searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
  const query=await searchParams;
  const { supabase }=await requireSuperAdmin();

  const { data:storesData,error:storesError }=await supabase.rpc("get_admin_stores_v1",{
    target_organization_id:undefined,
    search_query:undefined,
  });
  if(storesError) throw new Error("Unable to load stores.");

  const stores=(storesData ?? []) as StoreRow[];
  const requestedStoreId=typeof query.store==="string" ? query.store : stores[0]?.id;
  const saved=query.saved==="1";

  let designer:DesignerPayload|null=null;
  let organizationId:string|undefined;

  if(requestedStoreId){
    const [{data,error},{data:storeRow,error:storeError}]=await Promise.all([
      supabase.rpc("get_admin_store_design_page_v1",{target_store_id:requestedStoreId}),
      supabase.from("stores").select("organization_id").eq("id",requestedStoreId).maybeSingle(),
    ]);
    if(error||storeError) throw new Error("Unable to load Store Design.");
    designer=data as DesignerPayload;
    organizationId=storeRow?.organization_id;
  }

  const model=designer?.designer;
  const theme=model?.theme;
  const commerce=model?.commerce;

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p className="admin-kicker">Storefront</p>
          <h2>Store Design</h2>
          <p>Control brand colors, logos, typography, and storefront media without touching code.</p>
        </div>
        {model?.store?.slug ? (
          <Link href={`/shop/${model.store.slug}`} target="_blank" className="admin-secondary-action">
            Preview Store ↗
          </Link>
        ) : null}
      </section>

      {saved ? (
        <div className="admin-save-success" role="status">
          <strong>Store design saved successfully.</strong>
          <span>Brand colors and media settings were updated.</span>
        </div>
      ) : null}

      <section className="admin-store-selector">
        <form method="get" action="/admin/store-design" className="admin-store-select-form">
          <label className="admin-field">
            <span>Store</span>
            <select name="store" defaultValue={requestedStoreId}>
              {stores.map((store)=><option key={store.id} value={store.id}>{store.name}</option>)}
            </select>
          </label>
          <button type="submit">Load Store</button>
        </form>
      </section>

      {model?.store ? (
        <form action={saveStoreDesign} className="admin-store-design-form">
          <input type="hidden" name="storeId" value={model.store.id}/>

          <section className="admin-settings-detail">
            <div className="admin-settings-detail__head">
              <div>
                <p className="admin-kicker">Brand Media</p>
                <h3>Logo & Hero Image</h3>
                <p>Use the visible Media Upload buttons below. Uploaded assets are saved to the Media Library for reuse.</p>
              </div>
              <Link href="/admin/media" className="admin-secondary-action">Open Media Library</Link>
            </div>

            <div className="admin-brand-media-grid">
              <div>
                <strong>Store Logo</strong>
                <p>Used in the storefront header and brand areas.</p>
                <ImageUploader
                  organizationId={organizationId}
                  urlInputName="logoUrl"
                  label="Media Upload"
                  initialUrl={theme?.logoUrl || ""}
                />
              </div>
              <div>
                <strong>Homepage Hero</strong>
                <p>Main campaign image for the storefront homepage.</p>
                <ImageUploader
                  organizationId={organizationId}
                  urlInputName="heroImageUrl"
                  label="Media Upload"
                  initialUrl={theme?.heroImageUrl || ""}
                />
              </div>
            </div>
          </section>

          <section className="admin-settings-detail">
            <div className="admin-settings-detail__head">
              <div>
                <p className="admin-kicker">Brand Palette</p>
                <h3>Store Colors</h3>
                <p>A small named palette keeps the storefront consistent and easier to maintain.</p>
              </div>
            </div>

            <div className="admin-color-editor-grid">
              {[
                ["primaryColor","Primary",theme?.primaryColor || "#111827"],
                ["secondaryColor","Secondary",theme?.secondaryColor || "#374151"],
                ["accentColor","Accent",theme?.accentColor || "#f59e0b"],
                ["backgroundColor","Background",theme?.backgroundColor || "#ffffff"],
                ["textColor","Text",theme?.textColor || "#111111"],
              ].map(([name,label,value])=>(
                <label key={name} className="admin-color-editor">
                  <span>{label}</span>
                  <input type="color" name={name} defaultValue={value}/>
                  <strong>{value}</strong>
                </label>
              ))}
            </div>
          </section>

          <section className="admin-settings-detail">
            <div className="admin-settings-detail__head">
              <div>
                <p className="admin-kicker">Typography</p>
                <h3>Fonts</h3>
                <p>Keep typography simple and consistent across every page.</p>
              </div>
            </div>
            <div className="admin-editor-fields admin-editor-fields--two admin-store-design-fields">
              <label className="admin-field"><span>Heading font</span><input name="headingFontFamily" defaultValue={theme?.headingFontFamily || "Inter, ui-sans-serif, system-ui, sans-serif"}/></label>
              <label className="admin-field"><span>Body font</span><input name="bodyFontFamily" defaultValue={theme?.bodyFontFamily || "Inter, ui-sans-serif, system-ui, sans-serif"}/></label>
            </div>
          </section>

          <section className="admin-settings-detail">
            <div className="admin-settings-detail__head">
              <div>
                <p className="admin-kicker">Content Workflow</p>
                <h3>Pages & Homepage</h3>
                <p>Page structure is managed separately so branding changes do not accidentally delete content.</p>
              </div>
              <Link href={`/admin/page-editor?store=${model.store.id}`} className="admin-primary-action">Open Page Editor</Link>
            </div>
            <div className="admin-section-order">
              <div><span>01</span><strong>Homepage</strong><Link href={`/admin/stores/${model.store.id}/builder?store=${model.store.id}`}>Edit homepage</Link></div>
              {(model.homepageSections ?? []).slice(0,5).map((section,index)=>(
                <div key={section.id}>
                  <span>{String(index+2).padStart(2,"0")}</span>
                  <strong>{section.type.replaceAll("_"," ")}</strong>
                  <span>{section.enabled?"Visible":"Hidden"}</span>
                </div>
              ))}
            </div>
          </section>

          <input type="hidden" name="currency" value={commerce?.currency || "USD"}/>
          <input
            type="hidden"
            name="freeShippingThresholdCents"
            value={commerce?.freeShippingThresholdCents == null ? "" : String(commerce.freeShippingThresholdCents/100)}
          />
          <input type="hidden" name="cartNote" value={commerce?.cartNote || ""}/>
          <input type="hidden" name="checkoutButtonLabel" value={commerce?.checkoutButtonLabel || "Checkout"}/>
          <input type="hidden" name="continueShoppingLabel" value={commerce?.continueShoppingLabel || "Continue Shopping"}/>

          <div className="admin-editor-savebar">
            <span className="admin-muted">Changes affect the selected store only.</span>
            <button type="submit">Save Store Design</button>
          </div>
        </form>
      ) : (
        <div className="admin-empty admin-empty--large"><h3>No store selected.</h3></div>
      )}
    </div>
  );
}
