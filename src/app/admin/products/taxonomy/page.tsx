import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { saveCategory, saveCollection } from "./actions";
import { ImageUploader } from "@/components/admin/image-uploader";

type Category={
  id:string;name:string;slug:string;description?:string|null;imageUrl?:string|null;usesSize:boolean;usesColor:boolean;
  defaultSizes?:string[];defaultColors?:string[];active:boolean;productCount:number;
};
type Collection={
  id:string;organizationId:string;name:string;slug:string;description?:string|null;imageUrl?:string|null;
  type:string;status:string;displayOrder:number;productCount:number;
};

export default async function TaxonomyPage() {
  const { supabase }=await requireSuperAdmin();

  const [{data:taxonomy,error},{data:setup,error:setupError}]=await Promise.all([
    supabase.rpc("get_admin_taxonomy_page_v1",{target_organization_id:undefined}),
    supabase.rpc("get_admin_merchandising_setup_v2",{target_organization_id:undefined}),
  ]);

  if(error||setupError) throw new Error("Unable to load Categories & Collections.");

  const payload=(taxonomy ?? {}) as {categories?:Category[];collections?:Collection[]};
  const organizations=((setup ?? {}) as {organizations?:Array<{id:string;name:string}>}).organizations ?? [];

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p className="admin-kicker">Products</p>
          <h2>Categories & Collections</h2>
          <p>Categories describe what a product is. Collections explain why products are grouped.</p>
        </div>
        <Link href="/admin/products" className="admin-secondary-action">Back to Products</Link>
      </section>

      <section className="admin-taxonomy-explainer">
        <div><span>Category</span><strong>What the product is</strong><p>T-Shirts, Hoodies, Headwear, Accessories</p></div>
        <div><span>Collection</span><strong>Why products are grouped</strong><p>Gridley Titans, Fall 2026, Staff Apparel</p></div>
      </section>

      <div className="admin-taxonomy-grid">
        <section className="admin-panel">
          <div className="admin-panel__head"><div><p className="admin-kicker">Categories</p><h3>Product types</h3></div></div>
          <form action={saveCategory} className="admin-create-form admin-create-form--bordered">
            <p className="admin-kicker">New Category</p>
            <label className="admin-field"><span>Name</span><input name="name" required placeholder="T-Shirts"/></label>
            <label className="admin-field"><span>Description</span><textarea name="description" rows={3}/></label>
            <ImageUploader scope="master" urlInputName="imageUrl" label="Upload Category Image" />
            <label className="admin-check-row"><input name="usesSize" type="checkbox" defaultChecked/><span>Uses Size</span></label>
            <label className="admin-check-row"><input name="usesColor" type="checkbox" defaultChecked/><span>Uses Color</span></label>
            <label className="admin-field"><span>Default sizes</span><input name="defaultSizes" defaultValue="Small, Medium, Large, XL, 2XL, 3XL, 4XL"/></label>
            <label className="admin-field"><span>Default colors</span><input name="defaultColors"/></label>
            <label className="admin-check-row"><input name="active" type="checkbox" defaultChecked/><span>Active</span></label>
            <button className="admin-primary-action">Create Category</button>
          </form>

          <div className="admin-taxonomy-list">
            {(payload.categories ?? []).map((category)=>(
              <details key={category.id} className="admin-taxonomy-item">
                <summary>
                  <div><strong>{category.name}</strong><span>{category.productCount} products</span></div>
                  <div><span>{category.usesSize?"Size":""}{category.usesSize&&category.usesColor?" + ":""}{category.usesColor?"Color":""}</span><span className={`admin-status admin-status--${category.active?"published":"archived"}`}>{category.active?"active":"inactive"}</span></div>
                </summary>
                <form action={saveCategory} className="admin-taxonomy-form">
                  <input type="hidden" name="id" value={category.id}/>
                  <label className="admin-field"><span>Name</span><input name="name" defaultValue={category.name} required/></label>
                  <label className="admin-field admin-field--wide"><span>Description</span><textarea name="description" rows={3} defaultValue={category.description || ""}/></label>
                  <ImageUploader scope="master" urlInputName="imageUrl" label="Upload Category Image" initialUrl={category.imageUrl || ""} />
                  <label className="admin-check-row"><input name="usesSize" type="checkbox" defaultChecked={category.usesSize}/><span>Uses Size</span></label>
                  <label className="admin-check-row"><input name="usesColor" type="checkbox" defaultChecked={category.usesColor}/><span>Uses Color</span></label>
                  <label className="admin-field"><span>Default sizes</span><input name="defaultSizes" defaultValue={(category.defaultSizes ?? []).join(", ")}/></label>
                  <label className="admin-field"><span>Default colors</span><input name="defaultColors" defaultValue={(category.defaultColors ?? []).join(", ")}/></label>
                  <label className="admin-check-row"><input name="active" type="checkbox" defaultChecked={category.active}/><span>Active</span></label>
                  <button className="admin-primary-action">Save Category</button>
                </form>
              </details>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__head"><div><p className="admin-kicker">Collections</p><h3>Merchandising groups</h3></div></div>
          <div className="admin-taxonomy-list">
            {(payload.collections ?? []).map((collection)=>(
              <details key={collection.id} className="admin-taxonomy-item">
                <summary>
                  <div><strong>{collection.name}</strong><span>{collection.productCount} products</span></div>
                  <div><span>{collection.type}</span><span className={`admin-status admin-status--${collection.status}`}>{collection.status}</span></div>
                </summary>
                <form action={saveCollection} className="admin-taxonomy-form">
                  <input type="hidden" name="id" value={collection.id}/>
                  <input type="hidden" name="organizationId" value={collection.organizationId}/>
                  <label className="admin-field"><span>Name</span><input name="name" defaultValue={collection.name} required/></label>
                  <label className="admin-field"><span>Type</span><select name="type" defaultValue={collection.type}><option value="merchandising">Merchandising</option><option value="school">School</option><option value="team">Team</option><option value="organization">Organization</option><option value="event">Event</option><option value="seasonal">Seasonal</option><option value="featured">Featured</option></select></label>
                  <label className="admin-field admin-field--wide"><span>Description</span><textarea name="description" rows={3} defaultValue={collection.description || ""}/></label>
                  <label className="admin-field admin-field--wide"><span>Image URL</span><input name="imageUrl" defaultValue={collection.imageUrl || ""}/></label>
                  <label className="admin-field"><span>Status</span><select name="status" defaultValue={collection.status}><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label>
                  <label className="admin-field"><span>Display order</span><input name="displayOrder" type="number" min="0" max="999" defaultValue={collection.displayOrder}/></label>
                  <button className="admin-primary-action">Save Collection</button>
                </form>
              </details>
            ))}
          </div>

          <form action={saveCollection} className="admin-create-form admin-create-form--bordered">
            <p className="admin-kicker">New Collection</p>
            <label className="admin-field"><span>Organization</span><select name="organizationId" required>{organizations.map((org)=><option key={org.id} value={org.id}>{org.name}</option>)}</select></label>
            <label className="admin-field"><span>Name</span><input name="name" required placeholder="Fall 2026"/></label>
            <label className="admin-field"><span>Type</span><select name="type" defaultValue="merchandising"><option value="merchandising">Merchandising</option><option value="school">School</option><option value="team">Team</option><option value="organization">Organization</option><option value="event">Event</option><option value="seasonal">Seasonal</option><option value="featured">Featured</option></select></label>
            <label className="admin-field"><span>Description</span><textarea name="description" rows={3}/></label>
            <input type="hidden" name="status" value="draft"/>
            <input type="hidden" name="displayOrder" value="0"/>
            <button className="admin-primary-action">Create Collection</button>
          </form>
        </section>
      </div>
    </div>
  );
}
