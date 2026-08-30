"use client";

import { useMemo, useState } from "react";
import { createMasterVendorProduct } from "./actions";
import { cloneTemplateToStore } from "../templates/actions";

type Vendor = { id:string; name:string };
type Store = { id:string; name:string; organizationName:string };
type Category = {
  id:string; name:string;
  uses_variant_group:boolean; variant_group_label:string;
  uses_size:boolean; size_label:string;
  uses_color:boolean; color_label:string;
  default_variant_groups:string[]; default_sizes:string[]; default_colors:string[];
};
type Field = {
  id:string; category_id:string; field_key:string; label:string; field_type:string; field_group:string;
  required:boolean; admin_only:boolean; hidden:boolean; display_order:number; options:string[];
  placeholder:string|null; help_text:string|null;
};
type Variant = { id?:string; variantGroup:string; size:string; color:string; skuSuffix:string; vendorPartNumber:string };
type Template = {
  id:string; name:string; vendor_id:string|null; vendor_part_number:string|null; category_id:string|null; category:string|null;
  description:string|null; sku_prefix:string|null; finished_sale_price:number; custom_data:unknown; variants:Variant[];
};

function slugify(value:string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}
function dollars(cents:number) { return (cents/100).toFixed(2); }
function record(value:unknown):Record<string,unknown> {
  return value && typeof value==="object" && !Array.isArray(value) ? value as Record<string,unknown> : {};
}

export function ProductOnboardingForm({
  vendors,categories,fields,templates,stores,
}:{
  vendors:Vendor[]; categories:Category[]; fields:Field[]; templates:Template[]; stores:Store[];
}) {
  const [vendorId,setVendorId]=useState("");
  const [selectedTemplateId,setSelectedTemplateId]=useState("");
  const [newProduct,setNewProduct]=useState(false);
  const [categoryId,setCategoryId]=useState("");
  const [name,setName]=useState("");
  const [slug,setSlug]=useState("");
  const [slugTouched,setSlugTouched]=useState(false);
  const [rows,setRows]=useState<Variant[]>([]);
  const [customData,setCustomData]=useState<Record<string,string|boolean>>({});
  const [saveMode,setSaveMode]=useState<"library_only"|"add_to_store">("library_only");

  const vendorTemplates=useMemo(()=>templates.filter(t=>t.vendor_id===vendorId),[templates,vendorId]);
  const selectedTemplate=templates.find(t=>t.id===selectedTemplateId);
  const selectedCategory=categories.find(c=>c.id===categoryId);
  const visibleFields=useMemo(
    ()=>fields.filter(f=>f.category_id===categoryId && !f.hidden).sort((a,b)=>a.field_group.localeCompare(b.field_group)||a.display_order-b.display_order),
    [fields,categoryId]
  );
  const groupedFields=useMemo(()=>{
    const map=new Map<string,Field[]>();
    for(const field of visibleFields){const list=map.get(field.field_group)??[];list.push(field);map.set(field.field_group,list);}
    return [...map.entries()];
  },[visibleFields]);

  function updateName(value:string){setName(value);if(!slugTouched)setSlug(slugify(value));}
  function addRow(seed?:Partial<Variant>){setRows(cur=>[...cur,{variantGroup:seed?.variantGroup??"",size:seed?.size??"",color:seed?.color??"",skuSuffix:seed?.skuSuffix??"",vendorPartNumber:seed?.vendorPartNumber??""}]);}
  function patchRow(index:number,patch:Partial<Variant>){setRows(cur=>cur.map((row,i)=>i===index?{...row,...patch}:row));}
  function removeRow(index:number){setRows(cur=>cur.filter((_,i)=>i!==index));}
  function loadCategoryDefaults(){
    if(!selectedCategory)return;
    const next:Variant[]=[];
    const groups=selectedCategory.uses_variant_group&&selectedCategory.default_variant_groups.length?selectedCategory.default_variant_groups:[""];
    const sizes=selectedCategory.uses_size&&selectedCategory.default_sizes.length?selectedCategory.default_sizes:[""];
    const colors=selectedCategory.uses_color&&selectedCategory.default_colors.length?selectedCategory.default_colors:[""];
    const maxRows=100;
    for(const group of groups)for(const size of sizes)for(const color of colors){
      if(next.length>=maxRows)break;
      next.push({variantGroup:group,size,color,skuSuffix:"",vendorPartNumber:""});
    }
    setRows(next.length?next:[{variantGroup:"",size:"",color:"",skuSuffix:"",vendorPartNumber:""}]);
  }

  function renderCustomField(field:Field) {
    const current=customData[field.field_key];
    const common={required:field.required,className:"rounded-xl border border-black/15 px-4 py-3 font-normal"} as const;
    if(field.field_type==="boolean") return (
      <label key={field.id} className="flex items-center gap-3 rounded-xl border border-black/10 p-4 text-sm font-semibold">
        <input type="checkbox" checked={current===true} onChange={e=>setCustomData(d=>({...d,[field.field_key]:e.target.checked}))} />
        <span>{field.label}{field.required?" *":""}{field.help_text?<span className="ml-2 font-normal text-black/45">{field.help_text}</span>:null}</span>
      </label>
    );
    return (
      <label key={field.id} className="grid gap-2 text-sm font-semibold">
        {field.label}{field.required?" *":""}
        {field.field_type==="select" ? (
          <select {...common} value={typeof current==="string"?current:""} onChange={e=>setCustomData(d=>({...d,[field.field_key]:e.target.value}))}>
            <option value="">Select {field.label.toLowerCase()}</option>
            {field.options.map(option=><option key={option} value={option}>{option}</option>)}
          </select>
        ) : field.field_type==="textarea" ? (
          <textarea {...common} rows={3} placeholder={field.placeholder??""} value={typeof current==="string"?current:""} onChange={e=>setCustomData(d=>({...d,[field.field_key]:e.target.value}))} />
        ) : (
          <input {...common} type={field.field_type==="number"?"number":"text"} placeholder={field.placeholder??""} value={typeof current==="string"?current:""} onChange={e=>setCustomData(d=>({...d,[field.field_key]:e.target.value}))} />
        )}
        {field.help_text?<span className="font-normal text-black/45">{field.help_text}</span>:null}
      </label>
    );
  }

  return <div className="grid gap-6">
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <p className="text-sm font-semibold text-black/45">Step 1</p>
      <h2 className="mt-1 text-2xl font-black">Choose vendor and product</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">Vendor
          <select value={vendorId} onChange={e=>{setVendorId(e.target.value);setSelectedTemplateId("");setNewProduct(false);setCategoryId("");setRows([]);setCustomData({});}} className="rounded-xl border border-black/15 px-4 py-3 font-normal">
            <option value="">Select vendor</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">Vendor product / part number
          <select disabled={!vendorId} value={newProduct?"__new__":selectedTemplateId} onChange={e=>{const value=e.target.value;if(value==="__new__"){setNewProduct(true);setSelectedTemplateId("");setRows([]);setCustomData({});}else{setNewProduct(false);setSelectedTemplateId(value);setSlug("");setSlugTouched(false);}}} className="rounded-xl border border-black/15 px-4 py-3 font-normal disabled:bg-neutral-100">
            <option value="">{vendorId?"Select saved product":"Choose vendor first"}</option>
            {vendorTemplates.map(t=><option key={t.id} value={t.id}>{t.vendor_part_number||"No part #"} · {t.name}</option>)}
            {vendorId?<option value="__new__">+ Onboard a new vendor product</option>:null}
          </select>
        </label>
      </div>
    </section>

    {selectedTemplate ? <section className="rounded-2xl border border-black/10 bg-white p-6">
      <p className="text-sm font-semibold text-black/45">Saved master product</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-2xl font-black">{selectedTemplate.name}</h2><p className="mt-1 text-sm text-black/50">{selectedTemplate.vendor_part_number} · {selectedTemplate.category||"Uncategorized"}</p></div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Reusable master</span>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-black/40">Remembered variants</p>
          <div className="mt-3 flex flex-wrap gap-2">{selectedTemplate.variants.map((v,i)=><span key={v.id??i} className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm">{[v.variantGroup,v.size,v.color].filter(Boolean).join(" · ")||"Base"}</span>)}{!selectedTemplate.variants.length?<span className="text-sm text-black/45">No variants saved.</span>:null}</div>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-black/40">Remembered product data</p>
          <div className="mt-3 grid gap-2 text-sm">{Object.entries(record(selectedTemplate.custom_data)).map(([key,val])=><div key={key} className="flex justify-between gap-4"><span className="font-semibold">{key.replaceAll("_"," ")}</span><span className="text-right text-black/60">{String(val)}</span></div>)}{!Object.keys(record(selectedTemplate.custom_data)).length?<span className="text-black/45">No custom master fields yet.</span>:null}</div>
        </div>
      </div>
      <form action={cloneTemplateToStore} className="mt-6 grid gap-4 md:grid-cols-2">
        <input type="hidden" name="templateId" value={selectedTemplate.id} />
        <label className="grid gap-2 text-sm font-semibold">Add to store<select name="storeId" required defaultValue="" className="rounded-xl border border-black/15 px-4 py-3 font-normal"><option value="" disabled>Select store</option>{stores.map(s=><option key={s.id} value={s.id}>{s.organizationName} · {s.name}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-semibold">Product name<input name="name" required defaultValue={selectedTemplate.name} onChange={e=>{if(!slugTouched)setSlug(slugify(e.target.value));}} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
        <label className="grid gap-2 text-sm font-semibold">Slug<input name="slug" required value={slug||slugify(selectedTemplate.name)} onChange={e=>{setSlugTouched(true);setSlug(slugify(e.target.value));}} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
        <label className="grid gap-2 text-sm font-semibold">Retail price $<input name="retailPrice" type="number" min="0" step="0.01" required defaultValue={dollars(selectedTemplate.finished_sale_price)} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
        <label className="grid gap-2 text-sm font-semibold">Revenue share %<input name="revenueShareRate" type="number" min="0" max="100" step="0.01" className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
        <label className="grid gap-2 text-sm font-semibold">Status<select name="status" defaultValue="draft" className="rounded-xl border border-black/15 px-4 py-3 font-normal"><option value="draft">Draft</option><option value="published">Published</option></select></label>
        <label className="flex items-center gap-3 text-sm font-semibold"><input name="featured" type="checkbox" /> Featured product</label>
        <button className="w-fit rounded-xl bg-black px-5 py-3 font-bold text-white">Add remembered product to store</button>
      </form>
    </section>:null}

    {newProduct&&vendorId?<form action={createMasterVendorProduct} className="grid gap-6">
      <input type="hidden" name="vendorId" value={vendorId} />
      <input type="hidden" name="variantsJson" value={JSON.stringify(rows)} />
      <input type="hidden" name="customDataJson" value={JSON.stringify(customData)} />
      <input type="hidden" name="saveMode" value={saveMode} />

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-sm font-semibold text-black/45">Step 2</p><h2 className="mt-1 text-2xl font-black">Define this vendor product once</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Vendor part number<input name="vendorPartNumber" required className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Product category<select name="categoryId" required value={categoryId} onChange={e=>{setCategoryId(e.target.value);setRows([]);setCustomData({});}} className="rounded-xl border border-black/15 px-4 py-3 font-normal"><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-semibold">Product name<input name="name" required value={name} onChange={e=>updateName(e.target.value)} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">SKU prefix<input name="skuPrefix" className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">Description<textarea name="description" rows={3} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
        </div>
      </section>

      {selectedCategory?<>
        {groupedFields.map(([group,groupFields])=><section key={group} className="rounded-2xl border border-black/10 bg-white p-6">
          <p className="text-sm font-semibold text-black/45">Category data</p><h2 className="mt-1 text-xl font-black">{group}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">{groupFields.map(renderCustomField)}</div>
        </section>)}

        <section className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-black/45">Step 3</p><h2 className="mt-1 text-2xl font-black">{selectedCategory.name} variants</h2><p className="mt-2 text-sm text-black/55">Only relevant variant axes are shown. These exact choices are remembered for this vendor part number.</p></div><div className="flex gap-2"><button type="button" onClick={loadCategoryDefaults} className="rounded-xl border border-black/15 px-4 py-2 text-sm font-bold">Load category defaults</button><button type="button" onClick={()=>addRow()} className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white">Add variant</button></div></div>
          <div className="mt-5 grid gap-3">{rows.map((row,index)=><div key={index} className="grid gap-3 rounded-xl bg-neutral-50 p-4 md:grid-cols-5">
            {selectedCategory.uses_variant_group?<label className="grid gap-1 text-xs font-semibold">{selectedCategory.variant_group_label}<input value={row.variantGroup} onChange={e=>patchRow(index,{variantGroup:e.target.value})} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>:null}
            {selectedCategory.uses_size?<label className="grid gap-1 text-xs font-semibold">{selectedCategory.size_label}<input value={row.size} onChange={e=>patchRow(index,{size:e.target.value})} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>:null}
            {selectedCategory.uses_color?<label className="grid gap-1 text-xs font-semibold">{selectedCategory.color_label}<input value={row.color} onChange={e=>patchRow(index,{color:e.target.value})} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>:null}
            <label className="grid gap-1 text-xs font-semibold">SKU suffix<input value={row.skuSuffix} onChange={e=>patchRow(index,{skuSuffix:e.target.value})} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
            <label className="grid gap-1 text-xs font-semibold">Variant vendor part #<input value={row.vendorPartNumber} onChange={e=>patchRow(index,{vendorPartNumber:e.target.value})} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
            <button type="button" onClick={()=>removeRow(index)} className="w-fit self-end rounded-lg border border-black/15 px-3 py-2 text-xs font-bold">Remove</button>
          </div>)}{!rows.length?<div className="rounded-xl border border-dashed border-black/15 p-5 text-sm text-black/45">No variants yet. Add only what this exact vendor product offers.</div>:null}</div>
        </section>
      </>:null}

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-sm font-semibold text-black/45">Step 4</p><h2 className="mt-1 text-2xl font-black">Pricing and destination</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3"><label className="grid gap-2 text-sm font-semibold">Blank product price $<input name="blankProductPrice" type="number" min="0" step="0.01" required defaultValue="0.00" className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label><label className="grid gap-2 text-sm font-semibold">Production material price $<input name="productionMaterialPrice" type="number" min="0" step="0.01" required defaultValue="0.00" className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label><label className="grid gap-2 text-sm font-semibold">Finished sale price $<input name="finishedSalePrice" type="number" min="0" step="0.01" required defaultValue="0.00" className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><button type="button" onClick={()=>setSaveMode("library_only")} className={`rounded-2xl border p-4 text-left ${saveMode==="library_only"?"border-black bg-black text-white":"border-black/15"}`}><span className="block font-black">Save to master product library only</span><span className="mt-1 block text-sm opacity-70">Remember reusable data and variants without assigning a store.</span></button><button type="button" onClick={()=>setSaveMode("add_to_store")} className={`rounded-2xl border p-4 text-left ${saveMode==="add_to_store"?"border-black bg-black text-white":"border-black/15"}`}><span className="block font-black">Save + add to store</span><span className="mt-1 block text-sm opacity-70">Save master data and create the storefront product now.</span></button></div>
        {saveMode==="add_to_store"?<div className="mt-5 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Store<select name="storeId" required defaultValue="" className="rounded-xl border border-black/15 px-4 py-3 font-normal"><option value="" disabled>Select store</option>{stores.map(s=><option key={s.id} value={s.id}>{s.organizationName} · {s.name}</option>)}</select></label><label className="grid gap-2 text-sm font-semibold">Slug<input name="slug" required value={slug} onChange={e=>{setSlugTouched(true);setSlug(slugify(e.target.value));}} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label><label className="grid gap-2 text-sm font-semibold">Revenue share %<input name="revenueShareRate" type="number" min="0" max="100" step="0.01" className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label><label className="grid gap-2 text-sm font-semibold">Status<select name="status" defaultValue="draft" className="rounded-xl border border-black/15 px-4 py-3 font-normal"><option value="draft">Draft</option><option value="published">Published</option></select></label><label className="flex items-center gap-3 text-sm font-semibold"><input name="featured" type="checkbox" /> Featured product</label></div>:<><input type="hidden" name="revenueShareRate" value="" /><input type="hidden" name="status" value="draft" /></>}
        <button className="mt-6 rounded-xl bg-black px-5 py-3 font-bold text-white">{saveMode==="library_only"?"Save reusable vendor product":"Save and add to store"}</button>
      </section>
    </form>:null}
  </div>;
}
