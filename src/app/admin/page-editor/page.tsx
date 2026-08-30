import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import {
  createStorePage,
  deleteStorePage,
  updateStorePage,
} from "@/app/admin/stores/[id]/pages/actions";

type StoreRow = {
  id:string;
  name:string;
  slug:string;
  status:string;
  organization_id:string;
};

type PageRow = {
  id:string;
  title:string;
  slug:string;
  page_type:string;
  nav_label:string|null;
  position:number;
  is_enabled:boolean;
  show_in_navigation:boolean;
};

export default async function PageEditorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const query=await searchParams;
  const { supabase }=await requireSuperAdmin();

  const { data:stores,error:storeError }=await supabase
    .from("stores")
    .select("id,name,slug,status,organization_id")
    .neq("status","archived")
    .order("name");

  if(storeError) throw new Error("Unable to load stores.");

  const storeRows=(stores ?? []) as StoreRow[];
  const requestedStoreId=typeof query.store==="string" ? query.store : storeRows[0]?.id;
  const selectedStore=storeRows.find((store)=>store.id===requestedStoreId) ?? storeRows[0];

  let pages:PageRow[]=[];
  let sectionCounts:Record<string,number>={};

  if(selectedStore){
    const [{data:pageData,error:pageError},{data:sectionData,error:sectionError}]=await Promise.all([
      supabase.from("store_pages").select("id,title,slug,page_type,nav_label,position,is_enabled,show_in_navigation").eq("store_id",selectedStore.id).order("position"),
      supabase.from("store_page_sections").select("page_id").eq("store_id",selectedStore.id),
    ]);

    if(pageError||sectionError) throw new Error("Unable to load Page Editor.");

    pages=(pageData ?? []) as PageRow[];
    for(const section of sectionData ?? []){
      sectionCounts[section.page_id]=(sectionCounts[section.page_id] ?? 0)+1;
    }
  }

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p className="admin-kicker">Content</p>
          <h2>Page Editor</h2>
          <p>Create, edit, preview, publish, and delete storefront pages without digging through Store settings.</p>
        </div>
        {selectedStore ? (
          <Link href={`/shop/${selectedStore.slug}`} target="_blank" className="admin-secondary-action">
            Preview Store ↗
          </Link>
        ) : null}
      </section>

      <section className="admin-store-selector">
        <form method="get" action="/admin/page-editor" className="admin-store-select-form">
          <label className="admin-field">
            <span>Store</span>
            <select name="store" defaultValue={selectedStore?.id}>
              {storeRows.map((store)=><option key={store.id} value={store.id}>{store.name}</option>)}
            </select>
          </label>
          <button type="submit">Load Store</button>
        </form>
      </section>

      {selectedStore ? (
        <>
          <section className="admin-page-editor-home">
            <div>
              <p className="admin-kicker">Homepage</p>
              <h3>Homepage</h3>
              <p>The homepage is permanent. Edit its sections, campaign content, images, and featured merchandising here.</p>
            </div>
            <div className="admin-page-editor-home__actions">
              <Link href={`/admin/stores/${selectedStore.id}/builder`} className="admin-primary-action">Edit Homepage</Link>
              <Link href={`/shop/${selectedStore.slug}`} target="_blank" className="admin-secondary-action">Preview</Link>
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel__head">
              <div>
                <p className="admin-kicker">Existing Pages</p>
                <h3>{pages.length} pages</h3>
              </div>
            </div>

            <div className="admin-page-editor-list">
              {pages.map((page)=>(
                <details key={page.id} className="admin-page-editor-item">
                  <summary>
                    <div>
                      <strong>{page.title}</strong>
                      <span>/{page.slug} · {sectionCounts[page.id] ?? 0} sections</span>
                    </div>
                    <div>
                      <span className={`admin-status admin-status--${page.is_enabled?"published":"draft"}`}>{page.is_enabled?"published":"draft"}</span>
                      <span>{page.show_in_navigation?"In menu":"Hidden from menu"}</span>
                    </div>
                  </summary>

                  <div className="admin-page-editor-item__body">
                    <form action={updateStorePage} className="admin-page-editor-form">
                      <input type="hidden" name="storeId" value={selectedStore.id}/>
                      <input type="hidden" name="pageId" value={page.id}/>
                      <label className="admin-field"><span>Page title</span><input name="title" defaultValue={page.title} required/></label>
                      <label className="admin-field"><span>URL slug</span><input name="slug" defaultValue={page.slug} required/></label>
                      <label className="admin-field"><span>Page type</span>
                        <select name="pageType" defaultValue={page.page_type}>
                          <option value="about">About</option><option value="mission">Mission</option><option value="cause">Cause</option>
                          <option value="faq">FAQ</option><option value="contact">Contact</option><option value="custom">Custom</option>
                        </select>
                      </label>
                      <label className="admin-field"><span>Navigation label</span><input name="navLabel" defaultValue={page.nav_label ?? ""}/></label>
                      <label className="admin-field"><span>Menu position</span><input name="position" type="number" min="0" max="999" defaultValue={page.position}/></label>
                      <label className="admin-check-row"><input name="isEnabled" type="checkbox" defaultChecked={page.is_enabled}/><span>Published</span></label>
                      <label className="admin-check-row"><input name="showInNavigation" type="checkbox" defaultChecked={page.show_in_navigation}/><span>Show in navigation</span></label>

                      <div className="admin-page-editor-actions">
                        <button className="admin-primary-action">Save Page Settings</button>
                        <Link href={`/admin/stores/${selectedStore.id}/pages#page-${page.id}`} className="admin-secondary-action">Edit Page Content</Link>
                        {page.is_enabled ? <Link href={`/shop/${selectedStore.slug}/${page.slug}`} target="_blank" className="admin-secondary-action">Preview</Link> : null}
                      </div>
                    </form>

                    <form action={deleteStorePage} className="admin-danger-zone">
                      <input type="hidden" name="storeId" value={selectedStore.id}/>
                      <input type="hidden" name="pageId" value={page.id}/>
                      <div>
                        <strong>Delete page</strong>
                        <span>This removes the page and its content sections. This cannot be undone.</span>
                      </div>
                      <button>Delete Page</button>
                    </form>
                  </div>
                </details>
              ))}
              {!pages.length ? <div className="admin-empty admin-empty--large"><h3>No custom pages yet.</h3><p>Create the first page below.</p></div> : null}
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel__head">
              <div>
                <p className="admin-kicker">Add New Page</p>
                <h3>Create page</h3>
              </div>
            </div>
            <form action={createStorePage} className="admin-page-create-form">
              <input type="hidden" name="storeId" value={selectedStore.id}/>
              <label className="admin-field"><span>Page title</span><input name="title" required placeholder="Our Mission"/></label>
              <label className="admin-field"><span>URL slug</span><input name="slug" required placeholder="our-mission"/></label>
              <label className="admin-field"><span>Page type</span>
                <select name="pageType" defaultValue="custom">
                  <option value="about">About</option><option value="mission">Mission</option><option value="cause">Cause</option>
                  <option value="faq">FAQ</option><option value="contact">Contact</option><option value="custom">Custom</option>
                </select>
              </label>
              <label className="admin-field"><span>Navigation label</span><input name="navLabel" placeholder="Mission"/></label>
              <label className="admin-field"><span>Menu position</span><input name="position" type="number" min="0" defaultValue={(pages.length+1)*10}/></label>
              <label className="admin-check-row"><input name="isEnabled" type="checkbox"/><span>Publish immediately</span></label>
              <label className="admin-check-row"><input name="showInNavigation" type="checkbox" defaultChecked/><span>Show in navigation</span></label>
              <button className="admin-primary-action">Create Page</button>
            </form>
          </section>
        </>
      ) : <div className="admin-empty admin-empty--large"><h3>No stores available.</h3></div>}
    </div>
  );
}
