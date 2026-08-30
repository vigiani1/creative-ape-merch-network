import Link from "next/link";
import { SetupRequired } from "@/components/setup-required";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { PublicStore } from "@/lib/supabase/public-types";

type PublicPage = { id:string; slug:string; title:string; page_type:string };
type PublicPageSection = { id:string; section_type:string; section_position:number; settings:unknown };
type PublicTheme = {
  primary_color:string; secondary_color:string; accent_color:string; background_color:string; text_color:string;
};

function value(settings:unknown,key:string) {
  if(!settings || typeof settings!=="object" || Array.isArray(settings)) return "";
  const v=(settings as Record<string,unknown>)[key];
  return typeof v==="string" ? v : typeof v==="number" ? String(v) : "";
}
function items(settings:unknown) {
  if(!settings || typeof settings!=="object" || Array.isArray(settings)) return [] as string[];
  const v=(settings as Record<string,unknown>).items;
  return Array.isArray(v) ? v.filter((x):x is string=>typeof x==="string") : [];
}

export default async function StoreContentPage({ params }:{ params:Promise<{slug:string;pageSlug:string}> }) {
  const {slug,pageSlug}=await params;
  if(!hasSupabaseEnv()) return <main className="mx-auto max-w-5xl p-8"><SetupRequired area="Store page" /></main>;

  const supabase=await createClient();
  const {data:stores}=await supabase.rpc("get_public_store",{store_slug:slug});
  const store=stores?.[0] as PublicStore | undefined;
  if(!store) return <main className="mx-auto max-w-5xl p-8"><h1 className="text-3xl font-black">Store not found</h1></main>;

  const [{data:pages},themeResult,navResult]=await Promise.all([
    supabase.rpc("get_public_store_page",{target_store_id:store.id,page_slug:pageSlug}),
    supabase.rpc("get_public_store_theme",{target_store_id:store.id}),
    supabase.rpc("get_public_store_pages",{target_store_id:store.id}),
  ]);
  const page=pages?.[0] as PublicPage | undefined;
  if(!page) return <main className="mx-auto max-w-5xl p-8"><h1 className="text-3xl font-black">Page not found</h1></main>;

  const {data:sections}=await supabase.rpc("get_public_store_page_sections",{target_page_id:page.id});
  const theme=themeResult.data?.[0] as PublicTheme | undefined;
  const nav=(navResult.data ?? []) as {slug:string;title:string;nav_label:string|null}[];
  const rows=(sections ?? []) as PublicPageSection[];

  return (
    <main className="min-h-screen" style={{backgroundColor:theme?.background_color ?? "#fff",color:theme?.text_color ?? "#111"}}>
      <header className="border-b border-black/10 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <Link href={`/shop/${store.slug}`} className="text-xl font-black">{store.title || store.name}</Link>
          <nav className="flex flex-wrap gap-4 text-sm font-semibold">
            <Link href={`/shop/${store.slug}`}>Home</Link>
            {nav.map((item)=><Link key={item.slug} href={`/shop/${store.slug}/${item.slug}`}>{item.nav_label || item.title}</Link>)}
          </nav>
        </div>
      </header>

      <section className="px-6 py-12" style={{backgroundColor:theme?.primary_color ?? "#111827",color:"#fff"}}>
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[.18em] opacity-70">{page.page_type}</p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">{page.title}</h1>
        </div>
      </section>

      {rows.map((section)=>{
        const title=value(section.settings,"title");
        const body=value(section.settings,"body");
        const imageUrl=value(section.settings,"image_url");
        const videoUrl=value(section.settings,"video_url");
        const buttonLabel=value(section.settings,"button_label");
        const buttonUrl=value(section.settings,"button_url");
        const buttonShape=value(section.settings,"button_shape") || "rounded";
        const align=value(section.settings,"align") || "left";
        const list=items(section.settings);
        const textAlign=align==="center" ? "text-center" : align==="right" ? "text-right" : "text-left";

        if(section.section_type==="announcement") return <section key={section.id} className="px-6 py-4 text-center text-sm font-bold" style={{backgroundColor:theme?.accent_color ?? "#f3f4f6"}}>{title || body}</section>;

        if(section.section_type==="video" && videoUrl) return (
          <section key={section.id} className={`mx-auto max-w-5xl px-6 py-12 ${textAlign}`}>
            {title?<h2 className="text-3xl font-black">{title}</h2>:null}
            {body?<p className="mt-3 whitespace-pre-line opacity-65">{body}</p>:null}
            <video src={videoUrl} controls className="mt-6 w-full rounded-3xl bg-black" />
          </section>
        );

        if(section.section_type==="buttons") return (
          <section key={section.id} className={`mx-auto max-w-5xl px-6 py-10 ${textAlign}`}>
            {title?<h2 className="text-3xl font-black">{title}</h2>:null}
            {body?<p className="mt-3 opacity-65">{body}</p>:null}
            <div className={`mt-5 flex flex-wrap gap-3 ${align==="center"?"justify-center":align==="right"?"justify-end":""}`}>
              {buttonLabel && buttonUrl ? <a href={buttonUrl} className={`bg-black px-5 py-3 font-bold text-white ${buttonShape==="pill"?"rounded-full":buttonShape==="square"?"rounded-none":"rounded-xl"}`}>{buttonLabel}</a>:null}
              {list.map((item)=><span key={item} className="rounded-xl border border-black/10 bg-white px-4 py-3">{item}</span>)}
            </div>
          </section>
        );

        if(section.section_type==="gallery") return (
          <section key={section.id} className="mx-auto max-w-6xl px-6 py-12">
            {title?<h2 className={`text-3xl font-black ${textAlign}`}>{title}</h2>:null}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[imageUrl,...list].filter(Boolean).map((url)=><img key={url} src={url} alt="" className="aspect-video w-full rounded-2xl object-cover" />)}
            </div>
          </section>
        );

        if(["faq","sponsors","socials"].includes(section.section_type)) return (
          <section key={section.id} className="mx-auto max-w-5xl px-6 py-12">
            {title?<h2 className={`text-3xl font-black ${textAlign}`}>{title}</h2>:null}
            {body?<p className={`mt-3 whitespace-pre-line opacity-65 ${textAlign}`}>{body}</p>:null}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">{list.map((item)=><div key={item} className="rounded-2xl border border-black/10 bg-white p-4">{item}</div>)}</div>
          </section>
        );

        if(section.section_type==="spacer") return <div key={section.id} className="h-12" />;

        return (
          <section key={section.id} className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-2 md:items-center">
            <div className={textAlign}>
              {title?<h2 className="text-3xl font-black">{title}</h2>:null}
              {body?<p className="mt-4 whitespace-pre-line text-lg opacity-65">{body}</p>:null}
              {buttonLabel && buttonUrl ? <a href={buttonUrl} className={`mt-6 inline-block bg-black px-5 py-3 font-bold text-white ${buttonShape==="pill"?"rounded-full":buttonShape==="square"?"rounded-none":"rounded-xl"}`}>{buttonLabel}</a>:null}
            </div>
            {imageUrl?<img src={imageUrl} alt="" className="w-full rounded-3xl object-cover" />:<div className="aspect-video rounded-3xl bg-black/5" />}
          </section>
        );
      })}
    </main>
  );
}
