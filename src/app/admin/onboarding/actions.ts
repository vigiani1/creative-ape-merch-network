"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

const ColorInput=z.object({
  name:z.string().trim().min(1).max(80),
  imageUrl:z.string().trim().max(1000).optional().default(""),
  displayOrder:z.number().int().min(0).max(999),
});

const NewMasterProduct=z.object({
  vendorId:z.string().uuid(),
  vendorPartNumber:z.string().trim().min(1).max(120),
  categoryId:z.string().uuid(),
  name:z.string().trim().min(2).max(160),
  skuPrefix:z.string().trim().max(80).optional(),
  description:z.string().trim().max(2000).optional(),
  primaryImageUrl:z.string().trim().max(1000).optional(),
  galleryUrls:z.string().max(12000).optional(),
  sizesJson:z.string(),
  colorsJson:z.string(),
  customDataJson:z.string(),
  qtyAvailable:z.coerce.number().int().min(0).max(1000000),
  blankProductPrice:z.coerce.number().min(0).max(100000),
  productionMaterialPrice:z.coerce.number().min(0).max(100000),
  finishedSalePrice:z.coerce.number().min(0).max(100000),
  saveMode:z.enum(["library_only","add_to_store"]),
  storeId:z.string().uuid().optional(),
  slug:z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120).optional(),
  revenueShareRate:z.union([z.literal(""),z.coerce.number().min(0).max(100)]),
  status:z.enum(["draft","published"]),
  featured:z.boolean(),
});

function cents(value:number){return Math.round(value*100);}
function unique(values:string[]){return [...new Set(values.map(v=>v.trim()).filter(Boolean))];}
function slugToken(value:string){return value.replace(/[^a-z0-9]+/gi,"-").replace(/^-+|-+$/g,"").toUpperCase();}

function buildOptionRows(sizes:string[],colors:{name:string}[]) {
  const rows:{size:string|null;color:string|null}[]=[];
  if(sizes.length&&colors.length) {
    for(const size of sizes) for(const color of colors) rows.push({size,color:color.name});
  } else if(sizes.length) {
    for(const size of sizes) rows.push({size,color:null});
  } else if(colors.length) {
    for(const color of colors) rows.push({size:null,color:color.name});
  }
  return rows;
}

export async function createMasterVendorProduct(formData:FormData) {
  const {supabase}=await requireSuperAdmin();
  const input=NewMasterProduct.parse({
    vendorId:formData.get("vendorId"),
    vendorPartNumber:formData.get("vendorPartNumber"),
    categoryId:formData.get("categoryId"),
    name:formData.get("name"),
    skuPrefix:String(formData.get("skuPrefix")??"")||undefined,
    description:String(formData.get("description")??"")||undefined,
    primaryImageUrl:String(formData.get("primaryImageUrl")??"")||undefined,
    galleryUrls:String(formData.get("galleryUrls")??"")||undefined,
    sizesJson:String(formData.get("sizesJson")??"[]"),
    colorsJson:String(formData.get("colorsJson")??"[]"),
    customDataJson:String(formData.get("customDataJson")??"{}"),
    qtyAvailable:formData.get("qtyAvailable")??0,
    blankProductPrice:formData.get("blankProductPrice"),
    productionMaterialPrice:formData.get("productionMaterialPrice"),
    finishedSalePrice:formData.get("finishedSalePrice"),
    saveMode:formData.get("saveMode"),
    storeId:String(formData.get("storeId")??"")||undefined,
    slug:String(formData.get("slug")??"")||undefined,
    revenueShareRate:String(formData.get("revenueShareRate")??""),
    status:formData.get("status"),
    featured:formData.get("featured")==="on",
  });

  const sizes=unique(z.array(z.string().trim().min(1).max(80)).max(30).parse(JSON.parse(input.sizesJson)));
  const colors=z.array(ColorInput).max(50).parse(JSON.parse(input.colorsJson));
  const colorNames=new Set<string>();
  for(const color of colors){
    const key=color.name.toLowerCase();
    if(colorNames.has(key)) throw new Error("Color names must be unique.");
    colorNames.add(key);
  }
  const galleryUrls=unique((input.galleryUrls??"").split(/\r?\n/)).slice(0,20);

  const parsedCustom:unknown=JSON.parse(input.customDataJson);
  if(!parsedCustom||typeof parsedCustom!=="object"||Array.isArray(parsedCustom)) throw new Error("Invalid advanced product data.");
  const rawCustom=parsedCustom as Record<string,unknown>;

  const [
    {data:category,error:categoryError},
    {data:fieldDefinitions,error:fieldsError},
    {data:existing,error:existingError},
  ]=await Promise.all([
    supabase.from("product_categories").select("id,name,uses_size,uses_color").eq("id",input.categoryId).eq("active",true).single(),
    supabase.from("product_category_fields").select("field_key,field_type,required,hidden,options").eq("category_id",input.categoryId),
    supabase.from("product_templates").select("id,name").eq("vendor_id",input.vendorId).ilike("vendor_part_number",input.vendorPartNumber).maybeSingle(),
  ]);

  if(categoryError||!category) throw new Error("Product category not found.");
  if(fieldsError) throw new Error("Unable to load product detail rules.");
  if(existingError) throw new Error("Unable to check the master product library.");
  if(existing) throw new Error(`That vendor part number is already saved as ${existing.name}. Choose it from the saved product list instead.`);
  if(!category.uses_size&&sizes.length) throw new Error("This category does not use size options.");
  if(!category.uses_color&&colors.length) throw new Error("This category does not use color options.");

  const customData:Record<string,string|number|boolean>={};
  for(const field of fieldDefinitions??[]) {
    if(field.hidden) continue;
    const value=rawCustom[field.field_key];
    const empty=value===undefined||value===null||value==="";
    if(field.required&&empty) throw new Error(`${field.field_key.replaceAll("_"," ")} is required.`);
    if(empty) continue;
    if(field.field_type==="boolean") customData[field.field_key]=value===true||value==="true";
    else if(field.field_type==="number"){
      const n=Number(value);
      if(!Number.isFinite(n)) throw new Error(`${field.field_key.replaceAll("_"," ")} must be a number.`);
      customData[field.field_key]=n;
    } else {
      const text=String(value).trim();
      if(field.field_type==="select"&&field.options.length&&!field.options.includes(text)) throw new Error(`Invalid option for ${field.field_key.replaceAll("_"," ")}.`);
      customData[field.field_key]=text;
    }
  }

  const {data:template,error:templateError}=await supabase.from("product_templates").insert({
    name:input.name,
    sku_prefix:input.skuPrefix??null,
    description:input.description??null,
    category_id:category.id,
    category:category.name,
    vendor_id:input.vendorId,
    vendor_part_number:input.vendorPartNumber,
    blank_product_cost:cents(input.blankProductPrice),
    production_material_cost:cents(input.productionMaterialPrice),
    finished_sale_price:cents(input.finishedSalePrice),
    base_production_cost:cents(input.blankProductPrice+input.productionMaterialPrice),
    custom_data:customData,
    primary_image_url:input.primaryImageUrl??null,
    gallery_urls:galleryUrls,
    active:true,
  }).select("id").single();

  if(templateError||!template) throw new Error(templateError?.code==="23505"?"That vendor + part number already exists.":"Unable to save master product.");

  const optionRows=buildOptionRows(sizes,colors);
  if(colors.length){
    const {error}=await supabase.from("product_template_color_options").insert(colors.map(color=>({
      product_template_id:template.id,color_name:color.name,image_url:color.imageUrl||null,display_order:color.displayOrder,active:true,
    })));
    if(error){await supabase.from("product_templates").delete().eq("id",template.id);throw new Error("Unable to save product colors.");}
  }
  if(optionRows.length){
    const {error}=await supabase.from("product_template_variants").insert(optionRows.map(row=>({
      product_template_id:template.id,
      size:row.size,
      color:row.color,
      sku_suffix:[row.color?slugToken(row.color):"",row.size?slugToken(row.size):""].filter(Boolean).join("-")||null,
      availability_status:"available",
      show_on_card:true,
      stackable:true,
      compressible:false,
      ships_alone:false,
    })));
    if(error){await supabase.from("product_templates").delete().eq("id",template.id);throw new Error("Unable to generate product variants.");}
  }

  if(input.saveMode==="library_only"){
    revalidatePath("/admin/onboarding");
    revalidatePath("/admin/templates");
    redirect(`/admin/onboarding?saved=${template.id}`);
  }

  if(!input.storeId||!input.slug) throw new Error("Choose a store and product slug.");

  const {data:store,error:storeError}=await supabase.from("stores").select("id,organization_id,slug").eq("id",input.storeId).single();
  if(storeError||!store) throw new Error("Store not found.");

  const {data:product,error:productError}=await supabase.from("products").insert({
    organization_id:store.organization_id,
    store_id:store.id,
    product_template_id:template.id,
    name:input.name,
    slug:input.slug,
    description:input.description??null,
    sku:input.skuPrefix??null,
    category:category.name,
    status:input.status,
    retail_price:cents(input.finishedSalePrice),
    production_cost:cents(input.blankProductPrice+input.productionMaterialPrice),
    default_revenue_share_rate:input.revenueShareRate===""?null:input.revenueShareRate,
    featured:input.featured,
    vendor_id:input.vendorId,
    vendor_part_number:input.vendorPartNumber,
    custom_overrides:{},
    inventory_quantity:input.qtyAvailable,
  }).select("id").single();

  if(productError||!product) throw new Error(productError?.code==="23505"?"That product slug is already used in this store.":"Master product saved, but storefront product creation failed.");

  if(colors.length){
    const {error}=await supabase.from("product_color_options").insert(colors.map(color=>({
      organization_id:store.organization_id,product_id:product.id,color_name:color.name,image_url:color.imageUrl||null,display_order:color.displayOrder,active:true,
    })));
    if(error){await supabase.from("products").delete().eq("id",product.id);throw new Error("Unable to copy product colors to the store.");}
  }

  if(optionRows.length){
    const {error}=await supabase.from("product_variants").insert(optionRows.map(row=>({
      organization_id:store.organization_id,
      product_id:product.id,
      size:row.size,
      color:row.color,
      sku:[input.skuPrefix,row.color?slugToken(row.color):"",row.size?slugToken(row.size):""].filter(Boolean).join("-")||null,
      inventory_quantity:null,
      availability_status:"available",
      show_on_card:true,
      stackable:true,
      compressible:false,
      ships_alone:false,
      managed_by_option_editor:true,
    })));
    if(error){await supabase.from("products").delete().eq("id",product.id);throw new Error("Unable to generate storefront variants.");}
  }

  const mediaRows=[
    ...(input.primaryImageUrl?[{organization_id:store.organization_id,product_id:product.id,media_type:"image",external_url:input.primaryImageUrl,display_order:0,is_primary:true,alt_text:input.name}]:[]),
    ...galleryUrls.filter(url=>url!==input.primaryImageUrl).map((url,index)=>({organization_id:store.organization_id,product_id:product.id,media_type:"image",external_url:url,display_order:index+1,is_primary:false,alt_text:input.name})),
  ];
  if(mediaRows.length) await supabase.from("product_media").insert(mediaRows);

  revalidatePath("/admin/onboarding");
  revalidatePath("/admin/templates");
  revalidatePath("/admin/products");
  revalidatePath(`/shop/${store.slug}`);
  redirect(`/admin/products/${product.id}`);
}
