"use client";

import { useMemo, useState } from "react";
import { saveProductOptions } from "@/app/admin/products/actions";

const SIZE_OPTIONS = ["Small","Medium","Large","XL","2XL","3XL","4XL"] as const;

type ColorRow = {
  id?: string;
  name: string;
  imageUrl: string;
};

export function ProductOptionEditor({
  productId,
  initialSizes,
  initialColors,
  initialQuantity,
  mediaUrls,
}: {
  productId: string;
  initialSizes: string[];
  initialColors: ColorRow[];
  initialQuantity: number | null;
  mediaUrls: { id:string; label:string; url:string }[];
}) {
  const [sizes,setSizes]=useState<string[]>(initialSizes);
  const [colors,setColors]=useState<ColorRow[]>(initialColors.length ? initialColors : [{name:"",imageUrl:""}]);

  const cleanColors=useMemo(
    ()=>colors.map((color,index)=>({
      name:color.name.trim(),
      imageUrl:color.imageUrl.trim(),
      displayOrder:index,
    })).filter((color)=>color.name),
    [colors]
  );

  function patchColor(index:number,patch:Partial<ColorRow>) {
    setColors((current)=>current.map((color,i)=>i===index?{...color,...patch}:color));
  }

  function addColorAfter(index:number) {
    setColors((current)=>[
      ...current.slice(0,index+1),
      {name:"",imageUrl:""},
      ...current.slice(index+1),
    ]);
  }

  function removeColor(index:number) {
    setColors((current)=>{
      const next=current.filter((_,i)=>i!==index);
      return next.length ? next : [{name:"",imageUrl:""}];
    });
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <div>
        <p className="text-sm font-semibold text-black/45">Customer options & inventory</p>
        <h2 className="mt-1 text-2xl font-black">Sizes, colors, and Qty Available</h2>
        <p className="mt-2 max-w-3xl text-sm text-black/55">
          This replaces the old variant editor for storefront choices. Inventory is tracked at the product level and is never shown to customers.
        </p>
      </div>

      <datalist id={`color-media-${productId}`}>
        {mediaUrls.map((asset)=><option key={asset.id} value={asset.url}>{asset.label}</option>)}
      </datalist>

      <form action={saveProductOptions} className="mt-6 grid gap-6">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="sizesJson" value={JSON.stringify(sizes)} />
        <input type="hidden" name="colorsJson" value={JSON.stringify(cleanColors)} />

        <div className="grid gap-6 lg:grid-cols-[260px_1fr_220px]">
          <label className="grid gap-2 text-sm font-semibold">
            Size
            <select
              multiple
              size={7}
              value={sizes}
              onChange={(event)=>{
                setSizes(Array.from(event.target.selectedOptions).map((option)=>option.value));
              }}
              className="min-h-[260px] rounded-xl border border-black/15 bg-white px-3 py-3 font-normal"
            >
              {SIZE_OPTIONS.map((size)=><option key={size} value={size} className="py-2">{size}</option>)}
            </select>
            <span className="text-xs font-normal text-black/45">Hold Ctrl/Cmd to select more than one size.</span>
          </label>

          <div className="grid gap-3">
            <div>
              <h3 className="text-sm font-semibold">Colors</h3>
              <p className="mt-1 text-xs text-black/45">Enter each available color. Attach a photo from the Media Library by choosing or pasting its URL.</p>
            </div>

            {colors.map((color,index)=>{
              const isLast=index===colors.length-1;
              return (
                <div key={index} className="grid gap-3 rounded-xl bg-neutral-50 p-4 md:grid-cols-[1fr_1.4fr_auto_auto] md:items-end">
                  <label className="grid gap-1 text-xs font-semibold">
                    Color
                    <input
                      value={color.name}
                      onChange={(event)=>patchColor(index,{name:event.target.value})}
                      placeholder="Black"
                      maxLength={80}
                      className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal"
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-semibold">
                    Color photo
                    <input
                      list={`color-media-${productId}`}
                      value={color.imageUrl}
                      onChange={(event)=>patchColor(index,{imageUrl:event.target.value})}
                      placeholder="Choose Media Library image or paste URL"
                      className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal"
                    />
                  </label>

                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-black/10 bg-white">
                    {color.imageUrl ? <img src={color.imageUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] text-black/35">Photo</span>}
                  </div>

                  <div className="flex gap-2">
                    {isLast ? (
                      <button
                        type="button"
                        onClick={()=>addColorAfter(index)}
                        className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white"
                      >
                        Add
                      </button>
                    ) : null}
                    {colors.length>1 ? (
                      <button
                        type="button"
                        onClick={()=>removeColor(index)}
                        className="rounded-lg border border-black/15 px-3 py-2 text-sm font-bold"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <label className="grid h-fit gap-2 text-sm font-semibold">
            Qty Available
            <input
              name="qtyAvailable"
              type="number"
              min="0"
              max="1000000"
              step="1"
              required
              defaultValue={initialQuantity ?? 0}
              className="rounded-xl border border-black/15 px-4 py-3 text-xl font-black"
            />
            <span className="text-xs font-normal text-black/45">
              Admin-only inventory memory. Each paid order subtracts from this number. Set it higher when new stock arrives.
            </span>
          </label>
        </div>

        <button className="w-fit rounded-xl bg-black px-5 py-3 font-bold text-white">
          Save sizes, colors & inventory
        </button>
      </form>
    </section>
  );
}
