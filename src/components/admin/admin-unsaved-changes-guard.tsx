"use client";

import { useEffect } from "react";

export function AdminUnsavedChangesGuard() {
  useEffect(()=>{
    let dirty=false;

    const markDirty=(event:Event)=>{
      const target=event.target as HTMLElement | null;
      if(!target?.closest("form")) return;
      dirty=true;
    };
    const clearDirty=()=>{ dirty=false; };
    const beforeUnload=(event:BeforeUnloadEvent)=>{
      if(!dirty) return;
      event.preventDefault();
      event.returnValue="";
    };
    const click=(event:MouseEvent)=>{
      if(!dirty) return;
      const target=event.target as HTMLElement | null;
      const link=target?.closest("a");
      if(!link || link.target==="_blank") return;
      const href=link.getAttribute("href");
      if(!href || href.startsWith("#")) return;
      if(window.confirm("You have unsaved changes. Leave this page and discard them?")){
        dirty=false;
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("input",markDirty,true);
    document.addEventListener("change",markDirty,true);
    document.addEventListener("submit",clearDirty,true);
    document.addEventListener("click",click,true);
    window.addEventListener("beforeunload",beforeUnload);

    return ()=>{
      document.removeEventListener("input",markDirty,true);
      document.removeEventListener("change",markDirty,true);
      document.removeEventListener("submit",clearDirty,true);
      document.removeEventListener("click",click,true);
      window.removeEventListener("beforeunload",beforeUnload);
    };
  },[]);

  return null;
}
