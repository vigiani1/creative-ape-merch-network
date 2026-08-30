"use client";

import { useMemo, useState } from "react";
import { createMasterVendorProduct } from "./actions";
import { cloneTemplateToStore } from "../templates/actions";

type Vendor={id:string;name:string};
type Store={id:string;name:string;organizationName:string};
type Category={
  id:string;name:string;uses_variant_group:boolean;variant_group_label:string;
  uses_size:boolean;size_label:string;uses_color:boolean;color_label:string;
  default_variant_groups:string[];default_sizes:string[];default_colors:string[];
};
type Field={
  id:string;category_id:string;field_key:string;label:string;field_type:string;field_group:string;
  required:boolean;admin_only:boolean;hidden:boolean;display_order:number;options:string[];
  placeholder:string|null;help_text:string|null;
};
type Template={
  id:string;name:string;vendor_id:string|null;vendor_part_number:string|null;category_id:string|null;category:string|null;
  description:string|null;sku_prefix:string|null;finished_sale_price:number;custom_data:unknown;
  primary_image_url:string|null;gallery_urls:string[];
  options:{sizes:string[];colors:{name:string;imageUrl:string}[]};
};
type ColorRow={name:string;imageUrl:string};

const steps=["Product","Media","Options","Inventory","Pricing","Store"] as const;

function slugify(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");}
function dollars(cents:number){return (cents/100).toFixed(2);}

export function ProductOnboardingForm({
  vendors,categories,fields,templates,stores,mediaUrls,
}:{
  vendors:Vendor[];categories:Category[];fields:Field[];templates:Template[];stores:Store[];
  mediaUrls:{id:string;label:string;url:string}[];
}) {
  const [vendorId,setVendorId]=useState("");
  const [selectedTemplateId,setSelectedTemplateId]=useState("");
  const [newProduct,setNewProduct]=useState(false);
  const [step,setStep]=useState(0);
  const [categoryId,setCategoryId]=useState("");
  const [name,setName]=useState("");
  const [slug,setSlug]=useState("");
  const [slugTouched,setSlugTouched]=useState(false);
  const [sizes,setSizes]=useState<string[]>([]);
  const [colors,setColors]=useState<ColorRow[]>([{name:"",imageUrl:""}]);
  const [customData,setCustomData]=useState<Record<string,string|boolean>>({});
  const [saveMode,setSaveMode]=useState<"library_only"|"add_to_store">("library_only");

  const vendorTemplates=useMemo(()=>templates.filter(t=>t.vendor_id===vendorId),[templates,vendorId]);
  const selectedTemplate=templates.find(t=>t.id===selectedTemplateId);
  const selectedCategory=categories.find(c=>c.id===categoryId);
  const optionSizes=selectedCategory?.uses_size
    ? (selectedCategory.default_sizes.length ? selectedCategory.default_sizes : ["Small","Medium","Large","XL","2XL","3XL","4XL"])
    : [];
  const visibleFields=fields.filter(f=>f.category_id===categoryId&&!f.hidden).sort((a,b)=>a.display_order-b.display_order);
  const cleanColors=colors.map((color,index)=>({name:color.name.trim(),imageUrl:color.imageUrl.trim(),displayOrder:index})).filter(c=>c.name);

  function resetForVendor(id:string){
    setVendorId(id);setSelectedTemplateId("");setNewProduct(false);setCategoryId("");setStep(0);
    setSizes([]);setColors([{name:"",imageUrl:""}]);setCustomData({});setSlug("");setSlugTouched(false);setName("");
  }
  function patchColor(index:number,patch:Partial<ColorRow>){setColors(cur=>cur.map((c,i)=>i===index?{...c,...patch}:c));}
  function addColor(){setColors(cur=>[...cur,{name:"",imageUrl:""}]);}
  function removeColor(index:number){setColors(cur=>{const next=cur.filter((_,i)=>i!==index);return next.length?next:[{name:"",imageUrl:""}];});}

  return <div className="grid gap-6">
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">Vendor
          <select value={vendorId} onChange={e=>resetForVendor(e.target.value)} className="rounded-xl border border-black/15 px-4 py-3 font-normal">
            <option value="">Select vendor</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">Product / vendor part number
          <select
            disabled={!vendorId}
            value={newProduct?"__new__":selectedTemplateId}
            onChange={e=>{
              const value=e.target.value;
              if(value==="__new__"){setNewProduct(true);setSelectedTemplateId("");setStep(0);}
              else{setNewProduct(false);setSelectedTemplateId(value);}
            }}
            className="rounded-xl border border-black/15 px-4 py-3 font-normal disabled:bg-neutral-100"
          >
            <option value="">{vendorId?"Select saved product":"Choose vendor first"}</option>
            {vendorTemplates.map(t=><option key={t.id} value={t.id}>{t.vendor_part_number||"No part #"} · {t.name}</option>)}
            {vendorId?<option value="__new__">+ Add a new vendor product</option>:null}
          </select>
        </label>
      </div>
    </section>

    {selectedTemplate?<section className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-black/45">Saved master product</p>
          <h2 className="mt-1 text-2xl font-black">{selectedTemplate.name}</h2>
          <p className="mt-1 text-sm text-black/50">{selectedTemplate.vendor_part_number} · {selectedTemplate.category||"Uncategorized"}</p>
        </div>
        {selectedTemplate.primary_image_url?<img src={selectedTemplate.primary_image_url} alt="" className="h-24 w-24 rounded-xl object-cover" />:null}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-neutral-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-black/40">Sizes</p>
          <div className="mt-2 flex flex-wrap gap-2">{selectedTemplate.options.sizes.map(size=><span key={size} className="rounded-full bg-white px-3 py-1 text-sm ring-1 ring-black/10">{size}</span>)}{!selectedTemplate.options.sizes.length?<span className="text-sm text-black/45">One size / no size options</span>:null}</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-black/40">Colors</p>
          <div className="mt-2 flex flex-wrap gap-2">{selectedTemplate.options.colors.map(color=><span key={color.name} className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm ring-1 ring-black/10">{color.imageUrl?<img src={color.imageUrl} alt="" className="h-5 w-5 rounded-full object-cover" />:null}{color.name}</span>)}{!selectedTemplate.options.colors.length?<span className="text-sm text-black/45">No color options</span>:null}</div>
        </div>
      </div>

      <form action={cloneTemplateToStore} className="mt-6 grid gap-4 md:grid-cols-2">
        <input type="hidden" name="templateId" value={selectedTemplate.id}/>
        <label className="grid gap-2 text-sm font-semibold">Store<select name="storeId" required defaultValue="" className="rounded-xl border border-black/15 px-4 py-3 font-normal"><option value="" disabled>Select store</option>{stores.map(s=><option key={s.id} value={s.id}>{s.organizationName} · {s.name}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-semibold">Product name<input name="name" required defaultValue={selectedTemplate.name} className="rounded-xl border border-black/15 px-4 py-3 font-normal"/></label>
        <label className="grid gap-2 text-sm font-semibold">Slug<input name="slug" required defaultValue={slugify(selectedTemplate.name)} className="rounded-xl border border-black/15 px-4 py-3 font-normal"/></label>
        <label className="grid gap-2 text-sm font-semibold">Retail price $<input name="retailPrice" type="number" min="0" step="0.01" required defaultValue={dollars(selectedTemplate.finished_sale_price)} className="rounded-xl border border-black/15 px-4 py-3 font-normal"/></label>
        <label className="grid gap-2 text-sm font-semibold">Qty Available<input name="qtyAvailable" type="number" min="0" step="1" required defaultValue="0" className="rounded-xl border border-black/15 px-4 py-3 font-normal"/></label>
        <label className="grid gap-2 text-sm font-semibold">Revenue share %<input name="revenueShareRate" type="number" min="0" max="100" step="0.01" className="rounded-xl border border-black/15 px-4 py-3 font-normal"/></label>
        <label className="grid gap-2 text-sm font-semibold">Status<select name="status" defaultValue="draft" className="rounded-xl border border-black/15 px-4 py-3 font-normal"><option value="draft">Draft</option><option value="published">Published</option></select></label>
        <label className="flex items-center gap-3 text-sm font-semibold"><input name="featured" type="checkbox"/> Featured product</label>
        <button className="w-fit rounded-xl bg-black px-5 py-3 font-bold text-white">Add product to store</button>
      </form>
    </section>:null}

    {newProduct&&vendorId?<form action={createMasterVendorProduct} className="rounded-2xl border border-black/10 bg-white p-6">
      <input type="hidden" name="vendorId" value={vendorId}/>
      <input type="hidden" name="sizesJson" value={JSON.stringify(sizes)}/>
      <input type="hidden" name="colorsJson" value={JSON.stringify(cleanColors)}/>
      <input type="hidden" name="customDataJson" value={JSON.stringify(customData)}/>
      <input type="hidden" name="saveMode" value={saveMode}/>

      <div className="mb-7 grid grid-cols-3 gap-2 md:grid-cols-6">
        {steps.map((label,index)=><button key={label} type="button" onClick={()=>setStep(index)} className={`rounded-xl px-3 py-2 text-xs font-bold ${step===index?"bg-black text-white":"bg-neutral-100"}`}>{index+1}. {label}</button>)}
      </div>

      <div className={step===0?"grid gap-5":"hidden"}>
        <div><p className="text-sm font-semibold text-black/45">Step 1</p><h2 className="text-2xl font-black">Product</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Vendor part number<input name="vendorPartNumber" required className="rounded-xl border border-black/15 px-4 py-3 font-normal"/></label>
          <label className="grid gap-2 text-sm font-semibold">Category<select name="categoryId" required value={categoryId} onChange={e=>{setCategoryId(e.target.value);setSizes([]);setColors([{name:"",imageUrl:""}]);setCustomData({});}} className="rounded-xl border border-black/15 px-4 py-3 font-normal"><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-semibold">Product name<input name="name" required value={name} onChange={e=>{setName(e.target.value);if(!slugTouched)setSlug(slugify(e.target.value));}} className="rounded-xl border border-black/15 px-4 py-3 font-normal"/></label>
          <label className="grid gap-2 text-sm font-semibold">Base SKU<input name="skuPrefix" className="rounded-xl border border-black/15 px-4 py-3 font-normal"/></label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">Description<textarea name="description" rows={4} className="rounded-xl border border-black/15 px-4 py-3 font-normal"/></label>
        </div>
        {visibleFields.length?<details className="rounded-xl bg-neutral-50 p-4"><summary className="cursor-pointer text-sm font-bold">Advanced product details</summary><div className="mt-4 grid gap-4 md:grid-cols-2">{visibleFields.map(field=><label key={field.id} className="grid gap-2 text-sm font-semibold">{field.label}{field.field_type==="select"?<select value={String(customData[field.field_key]??"")} onChange={e=>setCustomData(d=>({...d,[field.field_key]:e.target.value}))} className="rounded-xl border border-black/15 bg-white px-4 py-3 font-normal"><option value="">Select</option>{field.options.map(o=><option key={o}>{o}</option>)}</select>:field.field_type==="boolean"?<input type="checkbox" checked={customData[field.field_key]===true} onChange={e=>setCustomData(d=>({...d,[field.field_key]:e.target.checked}))}/>:<input value={String(customData[field.field_key]??"")} onChange={e=>setCustomData(d=>({...d,[field.field_key]:e.target.value}))} className="rounded-xl border border-black/15 bg-white px-4 py-3 font-normal"/>}</label>)}</div></details>:null}
      </div>

      <div className={step===1?"grid gap-5":"hidden"}>
        <div><p className="text-sm font-semibold text-black/45">Step 2</p><h2 className="text-2xl font-black">Media</h2><p className="mt-1 text-sm text-black/50">Choose reusable images from the Media Library.</p></div>
        <datalist id="onboarding-media">{mediaUrls.map(m=><option key={m.id} value={m.url}>{m.label}</option>)}</datalist>
        <label className="grid gap-2 text-sm font-semibold">Main product image<input list="onboarding-media" name="primaryImageUrl" className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="Choose image or paste URL"/></label>
        <label className="grid gap-2 text-sm font-semibold">Gallery image URLs<textarea name="galleryUrls" rows={5} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="One image URL per line"/></label>
      </div>

      <div className={step===2?"grid gap-6":"hidden"}>
        <div><p className="text-sm font-semibold text-black/45">Step 3</p><h2 className="text-2xl font-black">Options</h2><p className="mt-1 text-sm text-black/50">Choose customer-facing sizes and colors. Variant combinations are generated automatically.</p></div>
        {selectedCategory?.uses_size?<div><h3 className="text-sm font-bold">Size</h3><div className="mt-3 flex flex-wrap gap-2">{optionSizes.map(size=><label key={size} className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-bold ${sizes.includes(size)?"border-black bg-black text-white":"border-black/15"}`}><input type="checkbox" className="sr-only" checked={sizes.includes(size)} onChange={()=>setSizes(cur=>cur.includes(size)?cur.filter(x=>x!==size):[...cur,size])}/>{size}</label>)}</div></div>:null}
        {selectedCategory?.uses_color?<div className="grid gap-3"><h3 className="text-sm font-bold">Colors</h3>{colors.map((color,index)=><div key={index} className="grid gap-3 rounded-xl bg-neutral-50 p-4 md:grid-cols-[1fr_1.4fr_auto_auto] md:items-end"><label className="grid gap-1 text-xs font-semibold">Color<input value={color.name} onChange={e=>patchColor(index,{name:e.target.value})} placeholder="Black" className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal"/></label><label className="grid gap-1 text-xs font-semibold">Color photo<input list="onboarding-media" value={color.imageUrl} onChange={e=>patchColor(index,{imageUrl:e.target.value})} placeholder="Media Library image" className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal"/></label><div className="h-11 w-11 overflow-hidden rounded-lg bg-white ring-1 ring-black/10">{color.imageUrl?<img src={color.imageUrl} alt="" className="h-full w-full object-cover"/>:null}</div><div className="flex gap-2">{index===colors.length-1?<button type="button" onClick={addColor} className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white">Add</button>:null}{colors.length>1?<button type="button" onClick={()=>removeColor(index)} className="rounded-lg border border-black/15 px-3 py-2 text-sm font-bold">Remove</button>:null}</div></div>)}</div>:null}
      </div>

      <div className={step===3?"grid gap-5":"hidden"}>
        <div><p className="text-sm font-semibold text-black/45">Step 4</p><h2 className="text-2xl font-black">Inventory</h2></div>
        <label className="grid max-w-xs gap-2 text-sm font-semibold">Qty Available<input name="qtyAvailable" type="number" min="0" step="1" defaultValue="0" className="rounded-xl border border-black/15 px-4 py-3 text-xl font-black"/><span className="text-xs font-normal text-black/45">Private admin inventory. Customer pages show availability, not this number.</span></label>
      </div>

      <div className={step===4?"grid gap-5":"hidden"}>
        <div><p className="text-sm font-semibold text-black/45">Step 5</p><h2 className="text-2xl font-black">Pricing</h2></div>
        <div className="grid gap-4 md:grid-cols-3"><label className="grid gap-2 text-sm font-semibold">Blank product cost $<input name="blankProductPrice" type="number" min="0" step="0.01" required defaultValue="0.00" className="rounded-xl border border-black/15 px-4 py-3 font-normal"/></label><label className="grid gap-2 text-sm font-semibold">Production material cost $<input name="productionMaterialPrice" type="number" min="0" step="0.01" required defaultValue="0.00" className="rounded-xl border border-black/15 px-4 py-3 font-normal"/></label><label className="grid gap-2 text-sm font-semibold">Retail price $<input name="finishedSalePrice" type="number" min="0" step="0.01" required defaultValue="0.00" className="rounded-xl border border-black/15 px-4 py-3 font-normal"/></label></div>
      </div>

      <div className={step===5?"grid gap-5":"hidden"}>
        <div><p className="text-sm font-semibold text-black/45">Step 6</p><h2 className="text-2xl font-black">Store</h2></div>
        <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={()=>setSaveMode("library_only")} className={`rounded-2xl border p-4 text-left ${saveMode==="library_only"?"border-black bg-black text-white":"border-black/15"}`}><span className="block font-black">Save to Master Product Library</span><span className="mt-1 block text-sm opacity-70">Remember vendor data, media, sizes and colors for reuse.</span></button><button type="button" onClick={()=>setSaveMode("add_to_store")} className={`rounded-2xl border p-4 text-left ${saveMode==="add_to_store"?"border-black bg-black text-white":"border-black/15"}`}><span className="block font-black">Save + Add to Store</span><span className="mt-1 block text-sm opacity-70">Create the reusable master and a storefront product now.</span></button></div>
        {saveMode==="add_to_store"?<div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Store<select name="storeId" required defaultValue="" className="rounded-xl border border-black/15 px-4 py-3 font-normal"><option value="" disabled>Select store</option>{stores.map(s=><option key={s.id} value={s.id}>{s.organizationName} · {s.name}</option>)}</select></label><label className="grid gap-2 text-sm font-semibold">Slug<input name="slug" required value={slug} onChange={e=>{setSlugTouched(true);setSlug(slugify(e.target.value));}} className="rounded-xl border border-black/15 px-4 py-3 font-normal"/></label><label className="grid gap-2 text-sm font-semibold">Revenue share %<input name="revenueShareRate" type="number" min="0" max="100" step="0.01" className="rounded-xl border border-black/15 px-4 py-3 font-normal"/></label><label className="grid gap-2 text-sm font-semibold">Status<select name="status" defaultValue="draft" className="rounded-xl border border-black/15 px-4 py-3 font-normal"><option value="draft">Draft</option><option value="published">Published</option></select></label><label className="flex items-center gap-3 text-sm font-semibold"><input name="featured" type="checkbox"/> Featured product</label></div>:<><input type="hidden" name="revenueShareRate" value=""/><input type="hidden" name="status" value="draft"/></>}
      </div>

      <div className="mt-7 flex items-center justify-between border-t border-black/10 pt-5">
        <button type="button" disabled={step===0} onClick={()=>setStep(s=>Math.max(0,s-1))} className="rounded-xl border border-black/15 px-4 py-2.5 text-sm font-bold disabled:opacity-30">Back</button>
        {step<5?<button type="button" onClick={()=>setStep(s=>Math.min(5,s+1))} className="rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-white">Continue</button>:<button className="rounded-xl bg-black px-5 py-3 font-bold text-white">{saveMode==="library_only"?"Save master product":"Save and add to store"}</button>}
      </div>
    </form>:null}
  </div>;
}
