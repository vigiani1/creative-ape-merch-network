"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { signOut } from "@/app/login/actions";
import { AdminUnsavedChangesGuard } from "@/components/admin/admin-unsaved-changes-guard";

export type NavItem = { href: string; label: string; icon?: string };
export type AdminStoreOption = { id:string; name:string; slug:string };

const SESSION_KEY="creative-ape-admin-store";

function routeUsesStore(pathname:string){
  return pathname.startsWith("/admin/page-editor")
    || pathname.startsWith("/admin/store-design")
    || pathname.startsWith("/admin/products")
    || pathname.startsWith("/admin/media");
}

export function AppShell({
  title,
  eyebrow,
  nav,
  stores,
  children,
}: {
  title:string;
  eyebrow:string;
  nav:NavItem[];
  stores:AdminStoreOption[];
  children:React.ReactNode;
}) {
  const pathname=usePathname();
  const router=useRouter();
  const searchParams=useSearchParams();
  const [storeId,setStoreId]=useState("");
  const [toast,setToast]=useState<string|null>(null);

  const selectedStore=useMemo(()=>stores.find((store)=>store.id===storeId) ?? null,[stores,storeId]);
  const storeRequired=routeUsesStore(pathname);

  useEffect(()=>{
    const saved=sessionStorage.getItem(SESSION_KEY) ?? "";
    if(saved && stores.some((store)=>store.id===saved)) setStoreId(saved);
  },[stores]);

  useEffect(()=>{
    const fromUrl=searchParams.get("store");
    if(fromUrl && stores.some((store)=>store.id===fromUrl)){
      setStoreId(fromUrl);
      sessionStorage.setItem(SESSION_KEY,fromUrl);
    }
  },[searchParams,stores]);

  useEffect(()=>{
    const saved=searchParams.get("saved");
    const created=searchParams.get("created");
    if(saved==="1") setToast("Changes saved successfully.");
    if(created==="1") setToast("Created and saved successfully.");
  },[searchParams]);

  useEffect(()=>{
    const listener=(event:Event)=>{
      const detail=(event as CustomEvent<{message?:string}>).detail;
      setToast(detail?.message || "Changes saved successfully.");
    };
    window.addEventListener("admin:toast",listener as EventListener);
    return ()=>window.removeEventListener("admin:toast",listener as EventListener);
  },[]);

  useEffect(()=>{
    if(!toast) return;
    const timer=window.setTimeout(()=>setToast(null),3200);
    return ()=>window.clearTimeout(timer);
  },[toast]);

  useEffect(()=>{
    return ()=>{
      sessionStorage.removeItem(SESSION_KEY);
    };
  },[]);

  function selectStore(nextId:string){
    setStoreId(nextId);
    if(nextId) sessionStorage.setItem(SESSION_KEY,nextId);
    else sessionStorage.removeItem(SESSION_KEY);

    if(routeUsesStore(pathname)){
      const params=new URLSearchParams(searchParams.toString());
      if(nextId) params.set("store",nextId); else params.delete("store");
      router.replace(`${pathname}${params.toString()?`?${params.toString()}`:""}`);
    }
  }

  function navHref(href:string){
    if(!storeId || !routeUsesStore(href)) return href;
    return `${href}?store=${storeId}`;
  }

  return (
    <div className="admin-app">
      <AdminUnsavedChangesGuard />

      {toast ? (
        <div className="admin-toast" role="status" aria-live="polite">
          <strong>Saved</strong>
          <span>{toast}</span>
        </div>
      ) : null}

      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <Link href="/admin" className="admin-sidebar__wordmark">Creative Ape</Link>
          <p>{eyebrow}</p>
        </div>

        <nav className="admin-sidebar__nav" aria-label="Admin">
          {nav.map((item)=>{
            const active=item.href==="/admin" ? pathname==="/admin" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={navHref(item.href)} className={active?"admin-nav-link is-active":"admin-nav-link"}>
                <span className="admin-nav-link__dot" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <Link href={selectedStore?`/shop/${selectedStore.slug}`:"/shop/demo"} target="_blank">View storefront ↗</Link>
          <form action={signOut}><button type="submit">Sign out</button></form>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-topbar__eyebrow">Admin</p>
            <h1>{title}</h1>
          </div>

          <div className="admin-store-context">
            <span>Editing Store</span>
            <select value={storeId} onChange={(event)=>selectStore(event.target.value)} aria-label="Editing store">
              <option value="">Select Store</option>
              {stores.map((store)=><option key={store.id} value={store.id}>{store.name}</option>)}
            </select>
            {selectedStore ? <strong>{selectedStore.name}</strong> : <em>Select a store before editing</em>}
          </div>
        </header>

        <main className="admin-content">
          {storeRequired && !selectedStore ? (
            <section className="admin-store-required">
              <p className="admin-kicker">Store Required</p>
              <h2>Select a store to begin editing.</h2>
              <p>The store selector in the header locks the editing session to one storefront until you change it or leave Admin.</p>
            </section>
          ) : children}
        </main>
      </div>
    </div>
  );
}
