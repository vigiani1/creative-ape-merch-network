"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Org={id:string;name:string;number?:number};
type Asset={
  id:string;organization_id:string|null;scope:string;media_type:string;title:string|null;file_name:string;
  mime_type:string|null;storage_path:string;alt_text:string|null;tags:string[];publicUrl:string;
};

export function MediaLibraryEditor({organizations,assets,allowMaster,initialOrganizationId="",initialScope}:{organizations:Org[];assets:Asset[];allowMaster:boolean;initialOrganizationId?:string;initialScope?:"master"|"organization"}) {
  const router=useRouter();
  const imageInput=useRef<HTMLInputElement>(null);
  const videoInput=useRef<HTMLInputElement>(null);
  const [scope,setScope]=useState<"master"|"organization">(initialScope ?? (allowMaster?"master":"organization"));
  const [organizationId,setOrganizationId]=useState(initialOrganizationId || organizations[0]?.id || "");
  const [query,setQuery]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState<string|null>(null);

  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase();
    return assets.filter((asset)=>{
      const inScope=scope==="master" ? asset.scope==="master" : asset.organization_id===organizationId;
      if(!inScope) return false;
      if(!q) return true;
      return [asset.title,asset.file_name,asset.alt_text,...(asset.tags ?? [])].filter(Boolean)
        .some((value)=>String(value).toLowerCase().includes(q));
    });
  },[assets,organizationId,query,scope]);

  async function upload(file:File,mediaType:"image"|"video"){
    setBusy(true);setMessage(null);
    const body=new FormData();
    body.set("file",file);body.set("scope",scope);body.set("mediaType",mediaType);
    if(organizationId) body.set("organizationId",organizationId);

    const response=await fetch("/api/admin/media-upload",{method:"POST",body});
    const payload=await response.json() as {error?:string};
    setBusy(false);

    if(response.ok){
      const success=mediaType==="video" ? "Video uploaded and saved." : "Image uploaded and saved.";
      setMessage(success);
      window.dispatchEvent(new CustomEvent("admin:toast",{detail:{message:success}}));
      router.refresh();
    }else setMessage(payload.error || "Upload failed.");
  }

  async function remove(asset:Asset){
    setBusy(true);setMessage(null);
    const response=await fetch("/api/admin/media-delete",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({id:asset.id,storagePath:asset.storage_path}),
    });
    const payload=await response.json() as {error?:string};
    setBusy(false);
    if(response.ok){
      setMessage("Media removed.");
      window.dispatchEvent(new CustomEvent("admin:toast",{detail:{message:"Media removed successfully."}}));
      router.refresh();
    }else setMessage(payload.error || "Unable to remove media.");
  }

  return (
    <div className="admin-media-library">
      <section className="admin-media-upload-panel">
        <div>
          <p className="admin-kicker">Upload</p>
          <h3>Add media to the library</h3>
          <p>Images and videos use separate upload buttons so the accepted file type is always clear.</p>
        </div>
        <div className="admin-media-upload-buttons">
          <button type="button" disabled={busy} onClick={()=>imageInput.current?.click()}>Upload Images</button>
          <button type="button" disabled={busy} onClick={()=>videoInput.current?.click()}>Upload Videos</button>
        </div>
        <input ref={imageInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          onChange={(event)=>{const file=event.target.files?.[0];if(file)void upload(file,"image");event.currentTarget.value="";}} />
        <input ref={videoInput} hidden type="file" accept="video/mp4,video/webm"
          onChange={(event)=>{const file=event.target.files?.[0];if(file)void upload(file,"video");event.currentTarget.value="";}} />
      </section>

      <section className="admin-media-toolbar">
        {allowMaster ? (
          <label className="admin-field"><span>Library</span>
            <select value={scope} onChange={(event)=>setScope(event.target.value as "master"|"organization")}>
              <option value="master">Creative Ape master</option><option value="organization">Organization</option>
            </select>
          </label>
        ):null}

        <label className="admin-field"><span>Organization</span>
          <select disabled={scope==="master"} value={organizationId} onChange={(event)=>setOrganizationId(event.target.value)}>
            {organizations.map((org)=><option key={org.id} value={org.id}>{org.number?`CA-${String(org.number).padStart(6,"0")} · `:""}{org.name}</option>)}
          </select>
        </label>

        <label className="admin-field admin-field--wide"><span>Search media</span>
          <input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Name, alt text, tag..." />
        </label>
      </section>

      {message ? <p className="admin-media-message" role="status">{message}</p> : null}

      <section className="admin-media-grid">
        {filtered.map((asset)=>(
          <article key={asset.id} className="admin-media-card">
            <div className="admin-media-card__preview">
              {asset.media_type==="video" ? <video src={asset.publicUrl} controls preload="metadata" /> :
               asset.media_type==="image" ? <img src={asset.publicUrl} alt={asset.alt_text ?? ""}/> :
               <div className="admin-media-card__file">{asset.file_name}</div>}
              <span>{asset.media_type}</span>
            </div>
            <div className="admin-media-card__body">
              <div><h3>{asset.title || asset.file_name}</h3><p>{asset.file_name}</p></div>
              <div className="admin-media-card__actions">
                <button type="button" onClick={()=>navigator.clipboard.writeText(asset.publicUrl)}>Copy URL</button>
                <button type="button" disabled={busy} onClick={()=>void remove(asset)}>Remove</button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {!filtered.length ? <div className="admin-empty admin-empty--large"><h3>No media found.</h3><p>Upload an image or video, or adjust the library filter.</p></div>:null}
    </div>
  );
}
