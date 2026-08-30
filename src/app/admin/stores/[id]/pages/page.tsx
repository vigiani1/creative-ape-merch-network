import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createStorePage,
  createStorePageSection,
  deleteStorePage,
  deleteStorePageSection,
  updateStorePage,
  updateStorePageSection,
} from "./actions";
import { requireSuperAdmin } from "@/lib/auth";
import { ImageUploader } from "@/components/admin/image-uploader";

const sectionTypes = [
  ["hero","Hero"],["announcement","Announcement"],["story","Story"],["text_image","Text + image"],
  ["featured_products","Featured products"],["product_grid","Product grid"],["video","Video"],
  ["buttons","Buttons"],["gallery","Gallery"],["sponsors","Sponsors"],["socials","Social links"],
  ["faq","FAQ"],["spacer","Spacer"],
] as const;

function setting(settings: unknown,key:string) {
  if(!settings || typeof settings!=="object" || Array.isArray(settings)) return "";
  const value=(settings as Record<string,unknown>)[key];
  if(Array.isArray(value)) return value.filter((v):v is string=>typeof v==="string").join("\n");
  if(typeof value==="number") return String(value);
  return typeof value==="string" ? value : "";
}

export default async function StorePagesPage({ params }:{ params:Promise<{id:string}> }) {
  const {id}=await params;
  const {supabase}=await requireSuperAdmin();

  const [
    {data:store,error:storeError},
    {data:pages,error:pageError},
    {data:sections,error:sectionError},
    {data:assets,error:assetError},
  ]=await Promise.all([
    supabase.from("stores").select("id,name,slug,status,organization_id").eq("id",id).maybeSingle(),
    supabase.from("store_pages").select("*").eq("store_id",id).order("position"),
    supabase.from("store_page_sections").select("*").eq("store_id",id).order("position"),
    supabase.from("media_assets").select("id,organization_id,scope,title,file_name,storage_path,media_type").or(`scope.eq.master,organization_id.eq.${(await supabase.from("stores").select("organization_id").eq("id",id).maybeSingle()).data?.organization_id ?? "00000000-0000-0000-0000-000000000000"}`).order("created_at",{ascending:false}),
  ]);

  if(storeError || !store) notFound();
  if(pageError || sectionError || assetError) throw new Error("Unable to load Page Builder.");

  const media=(assets ?? []).map((asset)=>({
    ...asset,
    url:supabase.storage.from("media-library").getPublicUrl(asset.storage_path).data.publicUrl,
  }));

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href={`/admin/stores/${store.id}`} className="text-sm font-semibold underline">Back to store settings</Link>
          <p className="mt-4 text-sm font-semibold text-black/45">Super Admin page builder</p>
          <h1 className="mt-1 text-3xl font-black">{store.name} pages</h1>
          <p className="mt-2 max-w-3xl text-sm text-black/55">Create About, Mission, Cause, FAQ, Contact, or custom pages. Each page is made from ordered content sections and can use any reusable asset from the Media Library.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/stores/${store.id}/builder`} className="rounded-xl border border-black/15 px-4 py-2.5 text-sm font-bold">Home builder</Link>
          {store.status==="published" ? <Link href={`/shop/${store.slug}`} target="_blank" className="rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white">Preview store</Link> : null}
        </div>
      </div>

      <datalist id="media-library-urls">
        {media.map((asset)=><option key={asset.id} value={asset.url}>{asset.title || asset.file_name}</option>)}
      </datalist>

      {(pages ?? []).map((page)=>{
        const pageSections=(sections ?? []).filter((section)=>section.page_id===page.id);
        return (
          <section id={`page-${page.id}`} key={page.id} className="rounded-2xl border border-black/10 bg-white p-6">
            <form action={updateStorePage} className="grid gap-3 md:grid-cols-3">
              <input type="hidden" name="storeId" value={store.id} />
              <input type="hidden" name="pageId" value={page.id} />
              <label className="grid gap-1 text-xs font-semibold">Page title<input name="title" defaultValue={page.title} required className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
              <label className="grid gap-1 text-xs font-semibold">URL slug<input name="slug" defaultValue={page.slug} required className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
              <label className="grid gap-1 text-xs font-semibold">Page type
                <select name="pageType" defaultValue={page.page_type} className="rounded-lg border border-black/15 px-3 py-2 font-normal">
                  <option value="about">About</option><option value="mission">Mission</option><option value="cause">Cause</option><option value="faq">FAQ</option><option value="contact">Contact</option><option value="custom">Custom</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold">Navigation label<input name="navLabel" defaultValue={page.nav_label ?? ""} className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
              <label className="grid gap-1 text-xs font-semibold">Navigation position<input name="position" type="number" min="0" max="999" defaultValue={page.position} className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
              <div className="flex items-end gap-4 text-xs font-semibold">
                <label className="flex items-center gap-2"><input name="isEnabled" type="checkbox" defaultChecked={page.is_enabled} /> Enabled</label>
                <label className="flex items-center gap-2"><input name="showInNavigation" type="checkbox" defaultChecked={page.show_in_navigation} /> In menu</label>
              </div>
              <div className="flex gap-2 md:col-span-3">
                <button className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white">Save page</button>
                <button formAction={deleteStorePage} className="rounded-lg border border-black/15 px-4 py-2 text-sm font-bold">Delete page</button>
                {page.is_enabled && store.status==="published" ? <Link href={`/shop/${store.slug}/${page.slug}`} target="_blank" className="rounded-lg border border-black/15 px-4 py-2 text-sm font-bold">Preview</Link> : null}
              </div>
            </form>

            <div className="mt-6 border-t border-black/10 pt-5">
              <h3 className="text-lg font-black">Page sections</h3>
              <div className="mt-4 grid gap-4">
                {pageSections.map((section)=>(
                  <details key={section.id} className="rounded-xl bg-neutral-50 p-4">
                    <summary className="cursor-pointer font-bold">{section.position}. {section.section_type.replaceAll("_"," ")}</summary>
                    <form action={updateStorePageSection} className="mt-4 grid gap-3 md:grid-cols-3">
                      <input type="hidden" name="storeId" value={store.id} />
                      <input type="hidden" name="pageId" value={page.id} />
                      <input type="hidden" name="sectionId" value={section.id} />
                      <label className="grid gap-1 text-xs font-semibold">Section type
                        <select name="sectionType" defaultValue={section.section_type} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal">
                          {sectionTypes.map(([value,label])=><option key={value} value={value}>{label}</option>)}
                        </select>
                      </label>
                      <label className="grid gap-1 text-xs font-semibold">Position<input name="position" type="number" min="0" max="999" defaultValue={section.position} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
                      <label className="flex items-end gap-2 text-xs font-semibold"><input name="isEnabled" type="checkbox" defaultChecked={section.is_enabled} /> Enabled</label>
                      <label className="grid gap-1 text-xs font-semibold">Title<input name="title" defaultValue={setting(section.settings,"title")} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
                      <label className="grid gap-1 text-xs font-semibold">Alignment
                        <select name="align" defaultValue={setting(section.settings,"align") || "left"} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select>
                      </label>
                      <label className="grid gap-1 text-xs font-semibold">Featured count<input name="featuredCount" type="number" min="1" max="24" defaultValue={setting(section.settings,"featured_count")} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
                      <label className="grid gap-1 text-xs font-semibold md:col-span-3">Body<textarea name="body" rows={4} defaultValue={setting(section.settings,"body")} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
                      <div className="grid gap-1 text-xs font-semibold">
                        <span>Image / background</span>
                        <ImageUploader organizationId={store.organization_id} urlInputName="imageUrl" label="Media Upload" initialUrl={setting(section.settings,"image_url")} />
                      </div>
                      <label className="grid gap-1 text-xs font-semibold">Video URL<input list="media-library-urls" name="videoUrl" defaultValue={setting(section.settings,"video_url")} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
                      <label className="grid gap-1 text-xs font-semibold">General link URL<input name="linkUrl" defaultValue={setting(section.settings,"link_url")} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
                      <label className="grid gap-1 text-xs font-semibold">Button label<input name="buttonLabel" defaultValue={setting(section.settings,"button_label")} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
                      <label className="grid gap-1 text-xs font-semibold">Button URL<input name="buttonUrl" defaultValue={setting(section.settings,"button_url")} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
                      <label className="grid gap-1 text-xs font-semibold">Button shape
                        <select name="buttonShape" defaultValue={setting(section.settings,"button_shape") || "rounded"} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal"><option value="rounded">Rounded</option><option value="pill">Pill</option><option value="square">Square</option></select>
                      </label>
                      <label className="grid gap-1 text-xs font-semibold md:col-span-3">Items<textarea name="items" rows={4} defaultValue={setting(section.settings,"items")} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" placeholder="One item per line" /></label>
                      <div className="flex gap-2 md:col-span-3">
                        <button className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white">Save section</button>
                        <button formAction={deleteStorePageSection} className="rounded-lg border border-black/15 px-4 py-2 text-sm font-bold">Delete</button>
                      </div>
                    </form>
                  </details>
                ))}
              </div>

              <form action={createStorePageSection} className="mt-5 grid gap-3 rounded-xl border border-dashed border-black/20 p-4 md:grid-cols-3">
                <input type="hidden" name="storeId" value={store.id} />
                <input type="hidden" name="pageId" value={page.id} />
                <label className="grid gap-1 text-xs font-semibold">Section type<select name="sectionType" defaultValue="story" className="rounded-lg border border-black/15 px-3 py-2 font-normal">{sectionTypes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
                <label className="grid gap-1 text-xs font-semibold">Position<input name="position" type="number" defaultValue={(pageSections.length+1)*10} className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
                <label className="flex items-end gap-2 text-xs font-semibold"><input name="isEnabled" type="checkbox" defaultChecked /> Enabled</label>
                <label className="grid gap-1 text-xs font-semibold">Title<input name="title" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
                <label className="grid gap-1 text-xs font-semibold">Alignment<select name="align" defaultValue="left" className="rounded-lg border border-black/15 px-3 py-2 font-normal"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
                <label className="grid gap-1 text-xs font-semibold">Featured count<input name="featuredCount" type="number" min="1" max="24" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
                <label className="grid gap-1 text-xs font-semibold md:col-span-3">Body<textarea name="body" rows={3} className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
                <div className="grid gap-1 text-xs font-semibold">
                  <span>Image / media</span>
                  <ImageUploader organizationId={store.organization_id} urlInputName="imageUrl" label="Media Upload" />
                </div>
                <label className="grid gap-1 text-xs font-semibold">Video URL<input list="media-library-urls" name="videoUrl" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
                <label className="grid gap-1 text-xs font-semibold">Link URL<input name="linkUrl" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
                <label className="grid gap-1 text-xs font-semibold">Button label<input name="buttonLabel" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
                <label className="grid gap-1 text-xs font-semibold">Button URL<input name="buttonUrl" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
                <label className="grid gap-1 text-xs font-semibold">Button shape<select name="buttonShape" defaultValue="rounded" className="rounded-lg border border-black/15 px-3 py-2 font-normal"><option value="rounded">Rounded</option><option value="pill">Pill</option><option value="square">Square</option></select></label>
                <label className="grid gap-1 text-xs font-semibold md:col-span-3">Items<textarea name="items" rows={3} className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
                <button className="w-fit rounded-lg bg-black px-4 py-2 text-sm font-bold text-white md:col-span-3">Add section</button>
              </form>
            </div>
          </section>
        );
      })}

      <section className="rounded-2xl border border-dashed border-black/20 bg-white p-6">
        <h2 className="text-2xl font-black">Add page</h2>
        <form action={createStorePage} className="mt-5 grid gap-3 md:grid-cols-3">
          <input type="hidden" name="storeId" value={store.id} />
          <label className="grid gap-1 text-xs font-semibold">Title<input name="title" required placeholder="Our Mission" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
          <label className="grid gap-1 text-xs font-semibold">Slug<input name="slug" required placeholder="mission" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
          <label className="grid gap-1 text-xs font-semibold">Type<select name="pageType" defaultValue="mission" className="rounded-lg border border-black/15 px-3 py-2 font-normal"><option value="about">About</option><option value="mission">Mission</option><option value="cause">Cause</option><option value="faq">FAQ</option><option value="contact">Contact</option><option value="custom">Custom</option></select></label>
          <label className="grid gap-1 text-xs font-semibold">Navigation label<input name="navLabel" placeholder="Mission" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
          <label className="grid gap-1 text-xs font-semibold">Position<input name="position" type="number" min="0" defaultValue={(pages?.length ?? 0)*10+10} className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
          <div className="flex items-end gap-4 text-xs font-semibold"><label className="flex items-center gap-2"><input name="isEnabled" type="checkbox" defaultChecked /> Enabled</label><label className="flex items-center gap-2"><input name="showInNavigation" type="checkbox" defaultChecked /> In menu</label></div>
          <button className="w-fit rounded-lg bg-black px-4 py-2 text-sm font-bold text-white md:col-span-3">Create page</button>
        </form>
      </section>
    </div>
  );
}
