"use client";

import { useMemo, useState } from "react";
import { saveProductEditorV2 } from "@/app/admin/products/[id]/actions-v2";

type InventoryItem = {
  id?: string;
  size?: string | null;
  color?: string | null;
  quantity?: number | null;
  sku?: string | null;
  priceOverrideCents?: number | null;
};

type Editor = {
  product: {
    id: string;
    name: string;
    description?: string | null;
    sku?: string | null;
    categoryId?: string | null;
    priceCents: number;
    costCents: number;
    status: string;
    featured: boolean;
    organizationId: string;
  };
  sizes?: Array<{ name: string; active: boolean; displayOrder: number }>;
  colors?: Array<{ name: string; active: boolean; imageUrl?: string | null; displayOrder: number }>;
  inventory?: InventoryItem[];
  media?: unknown[];
  stores?: Array<{ id: string; name: string; isPrimary?: boolean }>;
  collections?: Array<{ id: string; name: string }>;
};

type Setup = {
  stores?: Array<{ id: string; name: string; organizationId: string }>;
  categories?: Array<{ id: string; name: string }>;
  collections?: Array<{ id: string; name: string; organizationId: string }>;
  standardSizes?: string[];
};

type ColorRow = { id: string; name: string; imageUrl: string };

export function ProductEditorForm({ editor, setup }: { editor: Editor; setup: Setup }) {
  const standardSizes = setup.standardSizes ?? ["Small","Medium","Large","XL","2XL","3XL","4XL"];
  const [selectedSizes, setSelectedSizes] = useState(
    new Set((editor.sizes ?? []).filter((item) => item.active).map((item) => item.name))
  );
  const [colors, setColors] = useState<ColorRow[]>(
    (editor.colors ?? []).length
      ? (editor.colors ?? []).filter((item) => item.active).map((item) => ({
          id: crypto.randomUUID(),
          name: item.name,
          imageUrl: item.imageUrl || "",
        }))
      : [{ id: crypto.randomUUID(), name: "", imageUrl: "" }]
  );

  const existingInventory = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    for (const item of editor.inventory ?? []) {
      map.set(`${item.size ?? ""}::${item.color ?? ""}`, item);
    }
    return map;
  }, [editor.inventory]);

  const activeColors = colors.map((item) => item.name.trim()).filter(Boolean);
  const activeSizes = standardSizes.filter((size) => selectedSizes.has(size));

  const combinations = useMemo(() => {
    if (activeSizes.length && activeColors.length) {
      return activeSizes.flatMap((size) => activeColors.map((color) => ({ size, color })));
    }
    if (activeSizes.length) return activeSizes.map((size) => ({ size, color: "" }));
    if (activeColors.length) return activeColors.map((color) => ({ size: "", color }));
    return [];
  }, [activeSizes.join("|"), activeColors.join("|")]);

  const [inventoryValues, setInventoryValues] = useState<Record<string, string>>(() => {
    const values: Record<string,string> = {};
    for (const item of editor.inventory ?? []) {
      values[`${item.size ?? ""}::${item.color ?? ""}`] = item.quantity == null ? "" : String(item.quantity);
    }
    return values;
  });

  const sizesJson = JSON.stringify(activeSizes.map((name,index) => ({
    name,
    displayOrder:(index+1)*10,
    active:true,
  })));

  const colorsJson = JSON.stringify(colors
    .map((item,index) => ({
      name:item.name.trim(),
      imageUrl:item.imageUrl.trim(),
      displayOrder:(index+1)*10,
      active:true,
    }))
    .filter((item) => item.name));

  const inventoryJson = JSON.stringify(combinations.map((combo) => {
    const key=`${combo.size}::${combo.color}`;
    const existing=existingInventory.get(key);
    const value=inventoryValues[key];
    return {
      size:combo.size,
      color:combo.color,
      quantity:value === undefined || value === "" ? null : Number(value),
      sku:existing?.sku || "",
      priceOverrideCents:existing?.priceOverrideCents ?? null,
    };
  }));

  const stores=(setup.stores ?? []).filter((store) => store.organizationId === editor.product.organizationId);
  const collections=(setup.collections ?? []).filter((item) => item.organizationId === editor.product.organizationId);
  const assignedStoreIds=new Set((editor.stores ?? []).map((store) => store.id));
  const assignedCollectionIds=new Set((editor.collections ?? []).map((collection) => collection.id));

  return (
    <form action={saveProductEditorV2} className="admin-product-form">
      <input type="hidden" name="productId" value={editor.product.id} />
      <input type="hidden" name="sizesJson" value={sizesJson} />
      <input type="hidden" name="colorsJson" value={colorsJson} />
      <input type="hidden" name="inventoryJson" value={inventoryJson} />

      <section className="admin-editor-section">
        <div className="admin-editor-section__head"><span>01</span><div><h3>Product</h3><p>Name, description, category, and SKU.</p></div></div>
        <div className="admin-editor-fields admin-editor-fields--two">
          <label className="admin-field"><span>Product name</span><input name="name" defaultValue={editor.product.name} required /></label>
          <label className="admin-field"><span>SKU</span><input name="sku" defaultValue={editor.product.sku || ""} /></label>
          <label className="admin-field admin-field--wide"><span>Description</span><textarea name="description" rows={5} defaultValue={editor.product.description || ""} /></label>
          <label className="admin-field"><span>Category</span><select name="categoryId" defaultValue={editor.product.categoryId || ""}><option value="">Select category</option>{(setup.categories ?? []).map((category)=><option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        </div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-section__head"><span>02</span><div><h3>Pricing</h3><p>Retail price and production cost.</p></div></div>
        <div className="admin-editor-fields admin-editor-fields--two">
          <label className="admin-field"><span>Price</span><div className="admin-money-input"><b>$</b><input name="price" type="number" step="0.01" min="0" defaultValue={(editor.product.priceCents/100).toFixed(2)} required /></div></label>
          <label className="admin-field"><span>Cost</span><div className="admin-money-input"><b>$</b><input name="cost" type="number" step="0.01" min="0" defaultValue={(editor.product.costCents/100).toFixed(2)} required /></div></label>
        </div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-section__head"><span>03</span><div><h3>Media</h3><p>Product gallery and color-specific images.</p></div></div>
        <div className="admin-media-placeholder"><div><strong>{editor.media?.length ?? 0} media items</strong><p>Use the Media Library to manage product photography.</p></div><a href="/admin/media">Open Media Library</a></div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-section__head"><span>04</span><div><h3>Size</h3><p>Select the sizes offered.</p></div></div>
        <div className="admin-size-options">{standardSizes.map((size)=><label key={size}><input type="checkbox" checked={selectedSizes.has(size)} onChange={(event)=>setSelectedSizes((current)=>{const next=new Set(current); if(event.target.checked) next.add(size); else next.delete(size); return next;})}/><span>{size}</span></label>)}</div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-section__head"><span>05</span><div><h3>Color</h3><p>Add, rename, or remove customer-facing colors.</p></div></div>
        <div className="admin-color-rows">
          {colors.map((color,index)=><div key={color.id} className="admin-color-row">
            <label className="admin-field"><span>Color {index+1}</span><input value={color.name} onChange={(event)=>setColors((current)=>current.map((row)=>row.id===color.id?{...row,name:event.target.value}:row))}/></label>
            <label className="admin-field admin-field--wide"><span>Color image URL <em>Optional</em></span><input value={color.imageUrl} onChange={(event)=>setColors((current)=>current.map((row)=>row.id===color.id?{...row,imageUrl:event.target.value}:row))}/></label>
            {colors.length>1?<button type="button" className="admin-row-remove" onClick={()=>setColors((current)=>current.filter((row)=>row.id!==color.id))}>Remove</button>:null}
          </div>)}
          <button type="button" className="admin-add-row" onClick={()=>setColors((current)=>[...current,{id:crypto.randomUUID(),name:"",imageUrl:""}])}>+ Add Color</button>
        </div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-section__head"><span>06</span><div><h3>Inventory</h3><p>Quantities by Size and Color combination.</p></div></div>
        <div className="admin-inventory-wrap">
          {combinations.length ? <table className="admin-inventory-table"><thead><tr><th>Size</th><th>Color</th><th>Quantity</th><th>SKU</th></tr></thead><tbody>{combinations.map((combo)=>{const key=`${combo.size}::${combo.color}`;const existing=existingInventory.get(key);return <tr key={key}><td>{combo.size || "—"}</td><td>{combo.color || "—"}</td><td><input type="number" min="0" value={inventoryValues[key] ?? (existing?.quantity == null ? "" : String(existing.quantity))} onChange={(event)=>setInventoryValues((current)=>({...current,[key]:event.target.value}))} placeholder="Unlimited" /></td><td>{existing?.sku || "Auto / optional"}</td></tr>})}</tbody></table>:<div className="admin-empty"><p>Add a Size or Color to create inventory rows.</p></div>}
        </div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-section__head"><span>07</span><div><h3>Stores & Collections</h3><p>Where this product appears.</p></div></div>
        <div className="admin-assignment-grid">
          <div><p>Stores</p>{stores.map((store)=><label key={store.id}><input type="checkbox" name="storeIds" value={store.id} defaultChecked={assignedStoreIds.has(store.id)}/><span>{store.name}</span></label>)}</div>
          <div><p>Collections</p>{collections.length?collections.map((collection)=><label key={collection.id}><input type="checkbox" name="collectionIds" value={collection.id} defaultChecked={assignedCollectionIds.has(collection.id)}/><span>{collection.name}</span></label>):<span className="admin-muted">No collections yet.</span>}</div>
        </div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-section__head"><span>08</span><div><h3>Publishing</h3><p>Control visibility and featured placement.</p></div></div>
        <div className="admin-editor-fields admin-editor-fields--two">
          <label className="admin-field"><span>Status</span><select name="status" defaultValue={editor.product.status}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
          <label className="admin-check-row"><input type="checkbox" name="featured" defaultChecked={editor.product.featured}/><span>Feature this product</span></label>
        </div>
      </section>

      <div className="admin-editor-savebar"><a href="/admin/products">Back</a><button type="submit">Save Product</button></div>
    </form>
  );
}
