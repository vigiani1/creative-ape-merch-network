"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

const PageInput = z.object({
  storeId: z.string().uuid(),
  pageId: z.string().uuid().optional(),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  title: z.string().trim().min(1).max(160),
  navLabel: z.string().trim().max(80).optional(),
  pageType: z.enum(["about","mission","cause","faq","contact","custom"]),
  position: z.coerce.number().int().min(0).max(999),
  isEnabled: z.boolean(),
  showInNavigation: z.boolean(),
});

async function getStore(storeId: string) {
  const { supabase } = await requireSuperAdmin();
  const { data: store, error } = await supabase.from("stores").select("id,organization_id,slug").eq("id", storeId).single();
  if (error || !store) throw new Error("Store not found.");
  return { supabase, store };
}

export async function createStorePage(formData: FormData) {
  const input = PageInput.parse({
    storeId: formData.get("storeId"),
    slug: formData.get("slug"),
    title: formData.get("title"),
    navLabel: String(formData.get("navLabel") ?? "") || undefined,
    pageType: formData.get("pageType"),
    position: formData.get("position"),
    isEnabled: formData.get("isEnabled") === "on",
    showInNavigation: formData.get("showInNavigation") === "on",
  });
  const { supabase, store } = await getStore(input.storeId);
  const { error } = await supabase.from("store_pages").insert({
    organization_id: store.organization_id,
    store_id: store.id,
    slug: input.slug,
    title: input.title,
    nav_label: input.navLabel ?? null,
    page_type: input.pageType,
    position: input.position,
    is_enabled: input.isEnabled,
    show_in_navigation: input.showInNavigation,
  });
  if (error) throw new Error(error.code === "23505" ? "That page slug already exists in this store." : "Unable to create page.");
  revalidatePath(`/admin/stores/${store.id}/pages`);
  revalidatePath(`/shop/${store.slug}`);
}

export async function updateStorePage(formData: FormData) {
  const input = PageInput.extend({ pageId: z.string().uuid() }).parse({
    storeId: formData.get("storeId"),
    pageId: formData.get("pageId"),
    slug: formData.get("slug"),
    title: formData.get("title"),
    navLabel: String(formData.get("navLabel") ?? "") || undefined,
    pageType: formData.get("pageType"),
    position: formData.get("position"),
    isEnabled: formData.get("isEnabled") === "on",
    showInNavigation: formData.get("showInNavigation") === "on",
  });
  const { supabase, store } = await getStore(input.storeId);
  const { error } = await supabase.from("store_pages").update({
    slug: input.slug,
    title: input.title,
    nav_label: input.navLabel ?? null,
    page_type: input.pageType,
    position: input.position,
    is_enabled: input.isEnabled,
    show_in_navigation: input.showInNavigation,
    updated_at: new Date().toISOString(),
  }).eq("id", input.pageId).eq("store_id", store.id);
  if (error) throw new Error("Unable to update page.");
  revalidatePath(`/admin/stores/${store.id}/pages`);
  revalidatePath(`/shop/${store.slug}`);
  revalidatePath(`/shop/${store.slug}/${input.slug}`);
}

export async function deleteStorePage(formData: FormData) {
  const input = z.object({ storeId:z.string().uuid(), pageId:z.string().uuid() }).parse({
    storeId:formData.get("storeId"), pageId:formData.get("pageId")
  });
  const { supabase, store } = await getStore(input.storeId);
  const { error } = await supabase.from("store_pages").delete().eq("id",input.pageId).eq("store_id",store.id);
  if (error) throw new Error("Unable to delete page.");
  revalidatePath(`/admin/stores/${store.id}/pages`);
  revalidatePath(`/shop/${store.slug}`);
}

const SectionType = z.enum(["hero","featured_products","product_grid","text_image","video","story","sponsors","announcement","socials","faq","buttons","gallery","spacer"]);
const SectionInput = z.object({
  storeId:z.string().uuid(),
  pageId:z.string().uuid(),
  sectionId:z.string().uuid().optional(),
  sectionType:SectionType,
  position:z.coerce.number().int().min(0).max(999),
  isEnabled:z.boolean(),
  title:z.string().trim().max(160).optional(),
  body:z.string().trim().max(5000).optional(),
  imageUrl:z.string().trim().max(1000).optional(),
  videoUrl:z.string().trim().max(1000).optional(),
  linkUrl:z.string().trim().max(1000).optional(),
  buttonLabel:z.string().trim().max(80).optional(),
  buttonUrl:z.string().trim().max(1000).optional(),
  buttonShape:z.enum(["rounded","pill","square"]).optional(),
  align:z.enum(["left","center","right"]).optional(),
  featuredCount:z.union([z.literal(""),z.coerce.number().int().min(1).max(24)]),
  items:z.string().trim().max(10000).optional(),
});

function parseSection(formData: FormData) {
  return SectionInput.parse({
    storeId:formData.get("storeId"),
    pageId:formData.get("pageId"),
    sectionId:String(formData.get("sectionId") ?? "") || undefined,
    sectionType:formData.get("sectionType"),
    position:formData.get("position"),
    isEnabled:formData.get("isEnabled") === "on",
    title:String(formData.get("title") ?? "") || undefined,
    body:String(formData.get("body") ?? "") || undefined,
    imageUrl:String(formData.get("imageUrl") ?? "") || undefined,
    videoUrl:String(formData.get("videoUrl") ?? "") || undefined,
    linkUrl:String(formData.get("linkUrl") ?? "") || undefined,
    buttonLabel:String(formData.get("buttonLabel") ?? "") || undefined,
    buttonUrl:String(formData.get("buttonUrl") ?? "") || undefined,
    buttonShape:String(formData.get("buttonShape") ?? "") || undefined,
    align:String(formData.get("align") ?? "") || undefined,
    featuredCount:String(formData.get("featuredCount") ?? ""),
    items:String(formData.get("items") ?? "") || undefined,
  });
}

function sectionSettings(input:z.infer<typeof SectionInput>) {
  return {
    title:input.title ?? null,
    body:input.body ?? null,
    image_url:input.imageUrl ?? null,
    video_url:input.videoUrl ?? null,
    link_url:input.linkUrl ?? null,
    button_label:input.buttonLabel ?? null,
    button_url:input.buttonUrl ?? null,
    button_shape:input.buttonShape ?? "rounded",
    align:input.align ?? "left",
    featured_count:input.featuredCount === "" ? null : input.featuredCount,
    items:input.items ? input.items.split("\n").map(v=>v.trim()).filter(Boolean) : [],
  };
}

async function assertPage(supabase: Awaited<ReturnType<typeof requireSuperAdmin>>["supabase"], storeId:string, pageId:string) {
  const { data, error } = await supabase.from("store_pages").select("id,organization_id").eq("id",pageId).eq("store_id",storeId).single();
  if (error || !data) throw new Error("Page not found.");
  return data;
}

export async function createStorePageSection(formData:FormData) {
  const input=parseSection(formData);
  const { supabase, store }=await getStore(input.storeId);
  await assertPage(supabase,store.id,input.pageId);
  const { error }=await supabase.from("store_page_sections").insert({
    organization_id:store.organization_id,store_id:store.id,page_id:input.pageId,
    section_type:input.sectionType,position:input.position,is_enabled:input.isEnabled,settings:sectionSettings(input),
  });
  if(error) throw new Error("Unable to create page section.");
  revalidatePath(`/admin/stores/${store.id}/pages`);
}

export async function updateStorePageSection(formData:FormData) {
  const input=parseSection(formData);
  if(!input.sectionId) throw new Error("Section ID is required.");
  const { supabase, store }=await getStore(input.storeId);
  await assertPage(supabase,store.id,input.pageId);
  const { error }=await supabase.from("store_page_sections").update({
    section_type:input.sectionType,position:input.position,is_enabled:input.isEnabled,settings:sectionSettings(input),updated_at:new Date().toISOString(),
  }).eq("id",input.sectionId).eq("page_id",input.pageId).eq("store_id",store.id);
  if(error) throw new Error("Unable to update page section.");
  revalidatePath(`/admin/stores/${store.id}/pages`);
}

export async function deleteStorePageSection(formData:FormData) {
  const input=z.object({storeId:z.string().uuid(),pageId:z.string().uuid(),sectionId:z.string().uuid()}).parse({
    storeId:formData.get("storeId"),pageId:formData.get("pageId"),sectionId:formData.get("sectionId")
  });
  const { supabase, store }=await getStore(input.storeId);
  const { error }=await supabase.from("store_page_sections").delete().eq("id",input.sectionId).eq("page_id",input.pageId).eq("store_id",store.id);
  if(error) throw new Error("Unable to delete page section.");
  revalidatePath(`/admin/stores/${store.id}/pages`);
}
