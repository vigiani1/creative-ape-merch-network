import Link from "next/link";
import { notFound } from "next/navigation";
import { createStoreSection, deleteStoreSection, updateStoreSection } from "../../actions";
import { requireSuperAdmin } from "@/lib/auth";

const sectionTypes = [
  ["hero", "Hero"],
  ["announcement", "Announcement"],
  ["story", "Story"],
  ["text_image", "Text + image"],
  ["featured_products", "Featured products"],
  ["product_grid", "Product grid"],
  ["video", "Video"],
  ["sponsors", "Sponsors"],
  ["socials", "Social links"],
  ["faq", "FAQ"],
] as const;

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function settingsValue(settings: unknown, key: string) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return "";
  const value = (settings as Record<string, unknown>)[key];
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string").join("\n");
  return typeof value === "string" ? value : "";
}

export default async function StoreBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireSuperAdmin();

  const { data: store, error: storeError } = await supabase.from("stores").select("id,name,slug,status,organization_id").eq("id", id).maybeSingle();
  if (storeError || !store) notFound();

  const [{ data: sections, error: sectionError }, { data: assets, error: assetError }] = await Promise.all([
    supabase.from("store_sections").select("id,section_type,position,is_enabled,settings").eq("store_id", id).order("position"),
    supabase.from("media_assets").select("id,title,file_name,storage_path,scope,organization_id").or(`scope.eq.master,organization_id.eq.${store.organization_id}`).order("created_at",{ascending:false}),
  ]);

  if (sectionError || assetError) throw new Error("Unable to load store builder.");
  const mediaUrls=(assets ?? []).map((asset)=>({
    id:asset.id,
    label:asset.title || asset.file_name,
    url:supabase.storage.from("media-library").getPublicUrl(asset.storage_path).data.publicUrl,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href={`/admin/stores/${store.id}`} className="text-sm font-semibold underline">Back to store settings</Link>
          <p className="mt-4 text-sm font-semibold text-black/45">Store builder</p>
          <h1 className="mt-1 text-3xl font-black">{store.name}</h1>
          <p className="mt-2 text-sm text-black/55">Sections render in ascending position order. Disable a section to hide it without deleting it.</p>
        </div>
        {store.status === "published" ? <Link href={`/shop/${store.slug}`} target="_blank" className="rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white">Preview storefront</Link> : null}
      </div>

      <datalist id="home-media-library-urls">{mediaUrls.map((asset)=><option key={asset.id} value={asset.url}>{asset.label}</option>)}</datalist>

      <div className="mt-8 grid gap-5">
        {(sections ?? []).map((section) => (
          <form key={section.id} action={updateStoreSection} className="grid gap-4 rounded-2xl border border-black/10 bg-white p-5">
            <input type="hidden" name="storeId" value={store.id} />
            <input type="hidden" name="sectionId" value={section.id} />

            <div className="grid gap-3 md:grid-cols-[1fr_130px_160px_auto] md:items-end">
              <label className="grid gap-2 text-sm font-semibold">Section type
                <select name="sectionType" defaultValue={section.section_type} className="rounded-xl border border-black/15 px-4 py-3 font-normal">
                  {sectionTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold">Position
                <input name="position" type="number" min="0" max="999" defaultValue={section.position} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
              </label>

              <label className="flex h-[50px] items-center gap-3 rounded-xl border border-black/15 px-4 text-sm font-semibold">
                <input name="isEnabled" type="checkbox" defaultChecked={section.is_enabled} className="h-4 w-4" /> Enabled
              </label>

              <span className="pb-3 text-xs font-semibold text-black/40">{titleCase(section.section_type)}</span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">Title
                <input name="title" maxLength={160} defaultValue={settingsValue(section.settings, "title")} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
              </label>

              <label className="grid gap-2 text-sm font-semibold">Link URL
                <input name="linkUrl" maxLength={1000} defaultValue={settingsValue(section.settings, "link_url")} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="https://..." />
              </label>

              <label className="grid gap-2 text-sm font-semibold md:col-span-2">Body
                <textarea name="body" rows={4} maxLength={3000} defaultValue={settingsValue(section.settings, "body")} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
              </label>

              <label className="grid gap-2 text-sm font-semibold">Image / background media
                <input list="home-media-library-urls" name="imageUrl" maxLength={1000} defaultValue={settingsValue(section.settings, "image_url")} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="Optional image URL" />
              </label>

              <label className="grid gap-2 text-sm font-semibold">Video media
                <input list="home-media-library-urls" name="videoUrl" maxLength={1000} defaultValue={settingsValue(section.settings, "video_url")} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="Optional video URL" />
              </label>

              <label className="grid gap-2 text-sm font-semibold">Button label
                <input name="buttonLabel" maxLength={80} defaultValue={settingsValue(section.settings, "button_label")} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">Button URL
                <input name="buttonUrl" maxLength={1000} defaultValue={settingsValue(section.settings, "button_url")} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">Button shape
                <select name="buttonShape" defaultValue={settingsValue(section.settings, "button_shape") || "rounded"} className="rounded-xl border border-black/15 px-4 py-3 font-normal"><option value="rounded">Rounded</option><option value="pill">Pill</option><option value="square">Square</option></select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">Alignment
                <select name="align" defaultValue={settingsValue(section.settings, "align") || "left"} className="rounded-xl border border-black/15 px-4 py-3 font-normal"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">Featured product count
                <input name="featuredCount" type="number" min="1" max="24" defaultValue={settingsValue(section.settings, "featured_count")} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">Minimum section height px
                <input name="minHeight" type="number" min="120" max="1200" defaultValue={settingsValue(section.settings, "min_height")} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2">Items
                <textarea name="items" rows={4} maxLength={5000} defaultValue={settingsValue(section.settings, "items")} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="One item per line for sponsors, social links, FAQs, etc." />
              </label>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white">Save section</button>
              <button formAction={deleteStoreSection} type="submit" className="rounded-xl border border-black/15 px-4 py-2.5 text-sm font-bold">Delete</button>
            </div>
          </form>
        ))}

        {!sections?.length ? <div className="rounded-2xl border border-dashed border-black/20 bg-white p-8 text-center text-sm text-black/45">No custom sections yet. Add the first one below.</div> : null}
      </div>

      <form action={createStoreSection} className="mt-8 grid gap-4 rounded-2xl border border-black/10 bg-neutral-50 p-6">
        <input type="hidden" name="storeId" value={store.id} />
        <div>
          <p className="text-sm font-semibold text-black/45">Add content block</p>
          <h2 className="mt-1 text-2xl font-black">New section</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_130px_160px]">
          <label className="grid gap-2 text-sm font-semibold">Section type
            <select name="sectionType" defaultValue="announcement" className="rounded-xl border border-black/15 bg-white px-4 py-3 font-normal">
              {sectionTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold">Position
            <input name="position" type="number" min="0" max="999" defaultValue={(sections?.length ?? 0) * 10 + 10} className="rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" />
          </label>

          <label className="flex h-[50px] items-center gap-3 self-end rounded-xl border border-black/15 bg-white px-4 text-sm font-semibold">
            <input name="isEnabled" type="checkbox" defaultChecked className="h-4 w-4" /> Enabled
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Title<input name="title" maxLength={160} className="rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Link URL<input name="linkUrl" maxLength={1000} className="rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">Body<textarea name="body" rows={4} maxLength={3000} className="rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Image URL<input name="imageUrl" maxLength={1000} className="rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Video URL<input name="videoUrl" maxLength={1000} className="rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Button label<input name="buttonLabel" maxLength={80} className="rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Button URL<input name="buttonUrl" maxLength={1000} className="rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Button shape<select name="buttonShape" defaultValue="rounded" className="rounded-xl border border-black/15 bg-white px-4 py-3 font-normal"><option value="rounded">Rounded</option><option value="pill">Pill</option><option value="square">Square</option></select></label>
          <label className="grid gap-2 text-sm font-semibold">Alignment<select name="align" defaultValue="left" className="rounded-xl border border-black/15 bg-white px-4 py-3 font-normal"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
          <label className="grid gap-2 text-sm font-semibold">Featured product count<input name="featuredCount" type="number" min="1" max="24" className="rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Minimum section height px<input name="minHeight" type="number" min="120" max="1200" className="rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">Items<textarea name="items" rows={4} maxLength={5000} className="rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" placeholder="One item per line" /></label>
        </div>

        <button type="submit" className="w-fit rounded-xl bg-black px-5 py-3 font-bold text-white">Add section</button>
      </form>
    </div>
  );
}
