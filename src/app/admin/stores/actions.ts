"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

const CreateStore = z.object({
  organizationId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  title: z.string().trim().max(160).optional(),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(["draft", "published"]),
});

export async function createStore(formData: FormData) {
  const { supabase } = await requireSuperAdmin();

  const input = CreateStore.parse({
    organizationId: formData.get("organizationId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    title: String(formData.get("title") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    status: formData.get("status"),
    availabilityStatus: formData.get("availabilityStatus"),
    startsAt: String(formData.get("startsAt") ?? "") || undefined,
    endsAt: String(formData.get("endsAt") ?? "") || undefined,
  });

  const { data: store, error } = await supabase
    .from("stores")
    .insert({
      organization_id: input.organizationId,
      name: input.name,
      slug: input.slug,
      title: input.title ?? null,
      description: input.description ?? null,
      status: input.status,
      published_at: input.status === "published" ? new Date().toISOString() : null,
    })
    .select("id,organization_id")
    .single();

  if (error || !store) {
    throw new Error(error?.code === "23505" ? "That store slug is already in use." : "Unable to create store.");
  }

  const { error: themeError } = await supabase.from("store_themes").insert({
    organization_id: store.organization_id,
    store_id: store.id,
  });

  if (themeError) {
    await supabase.from("stores").delete().eq("id", store.id);
    throw new Error("Unable to create the default store theme.");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/stores");
  revalidatePath(`/shop/${input.slug}`);
  redirect("/admin/stores");
}
const UpdateStore = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  title: z.string().trim().max(160).optional(),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(["draft", "published", "archived"]),
  availabilityStatus: z.enum(["active", "paused", "discontinued"]),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

export async function updateStore(formData: FormData) {
  const { supabase } = await requireSuperAdmin();

  const input = UpdateStore.parse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    title: String(formData.get("title") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    status: formData.get("status"),
  });

  const { data: existing, error: existingError } = await supabase
    .from("stores")
    .select("slug,published_at")
    .eq("id", input.id)
    .single();

  if (existingError || !existing) throw new Error("Store not found.");

  const { error } = await supabase
    .from("stores")
    .update({
      name: input.name,
      slug: input.slug,
      title: input.title ?? null,
      description: input.description ?? null,
      status: input.status,
      availability_status: input.availabilityStatus,
      starts_at: input.startsAt ? new Date(input.startsAt).toISOString() : null,
      ends_at: input.endsAt ? new Date(input.endsAt).toISOString() : null,
      published_at: input.status === "published" ? (existing.published_at ?? new Date().toISOString()) : existing.published_at,
    })
    .eq("id", input.id);

  if (error) throw new Error(error.code === "23505" ? "That store slug is already in use." : "Unable to update store.");

  revalidatePath("/admin");
  revalidatePath("/admin/stores");
  revalidatePath(`/admin/stores/${input.id}`);
  revalidatePath(`/shop/${existing.slug}`);
  revalidatePath(`/shop/${input.slug}`);
  redirect("/admin/stores");
}

const SectionType = z.enum([
  "hero",
  "featured_products",
  "product_grid",
  "text_image",
  "video",
  "story",
  "sponsors",
  "announcement",
  "socials",
  "faq",
]);

const SectionInput = z.object({
  storeId: z.string().uuid(),
  sectionId: z.string().uuid().optional(),
  sectionType: SectionType,
  position: z.coerce.number().int().min(0).max(999),
  isEnabled: z.boolean(),
  title: z.string().trim().max(160).optional(),
  body: z.string().trim().max(3000).optional(),
  imageUrl: z.string().trim().max(1000).optional(),
  linkUrl: z.string().trim().max(1000).optional(),
  videoUrl: z.string().trim().max(1000).optional(),
  items: z.string().trim().max(5000).optional(),
});

function sectionSettings(input: z.infer<typeof SectionInput>) {
  return {
    title: input.title || null,
    body: input.body || null,
    image_url: input.imageUrl || null,
    link_url: input.linkUrl || null,
    video_url: input.videoUrl || null,
    items: input.items
      ? input.items.split("\n").map((item) => item.trim()).filter(Boolean)
      : [],
  };
}

async function getStoreForSection(storeId: string) {
  const { supabase } = await requireSuperAdmin();
  const { data: store, error } = await supabase
    .from("stores")
    .select("id,organization_id,slug")
    .eq("id", storeId)
    .single();

  if (error || !store) throw new Error("Store not found.");
  return { supabase, store };
}

export async function createStoreSection(formData: FormData) {
  const input = SectionInput.parse({
    storeId: formData.get("storeId"),
    sectionType: formData.get("sectionType"),
    position: formData.get("position"),
    isEnabled: formData.get("isEnabled") === "on",
    title: String(formData.get("title") ?? "") || undefined,
    body: String(formData.get("body") ?? "") || undefined,
    imageUrl: String(formData.get("imageUrl") ?? "") || undefined,
    linkUrl: String(formData.get("linkUrl") ?? "") || undefined,
    videoUrl: String(formData.get("videoUrl") ?? "") || undefined,
    items: String(formData.get("items") ?? "") || undefined,
  });

  const { supabase, store } = await getStoreForSection(input.storeId);

  const { error } = await supabase.from("store_sections").insert({
    organization_id: store.organization_id,
    store_id: store.id,
    section_type: input.sectionType,
    position: input.position,
    is_enabled: input.isEnabled,
    settings: sectionSettings(input),
  });

  if (error) throw new Error("Unable to create store section.");

  revalidatePath(`/admin/stores/${store.id}/builder`);
  revalidatePath(`/shop/${store.slug}`);
}

export async function updateStoreSection(formData: FormData) {
  const input = SectionInput.extend({ sectionId: z.string().uuid() }).parse({
    storeId: formData.get("storeId"),
    sectionId: formData.get("sectionId"),
    sectionType: formData.get("sectionType"),
    position: formData.get("position"),
    isEnabled: formData.get("isEnabled") === "on",
    title: String(formData.get("title") ?? "") || undefined,
    body: String(formData.get("body") ?? "") || undefined,
    imageUrl: String(formData.get("imageUrl") ?? "") || undefined,
    linkUrl: String(formData.get("linkUrl") ?? "") || undefined,
    videoUrl: String(formData.get("videoUrl") ?? "") || undefined,
    items: String(formData.get("items") ?? "") || undefined,
  });

  const { supabase, store } = await getStoreForSection(input.storeId);

  const { error } = await supabase
    .from("store_sections")
    .update({
      section_type: input.sectionType,
      position: input.position,
      is_enabled: input.isEnabled,
      settings: sectionSettings(input),
    })
    .eq("id", input.sectionId)
    .eq("store_id", store.id);

  if (error) throw new Error("Unable to update store section.");

  revalidatePath(`/admin/stores/${store.id}/builder`);
  revalidatePath(`/shop/${store.slug}`);
}

export async function deleteStoreSection(formData: FormData) {
  const input = z.object({
    storeId: z.string().uuid(),
    sectionId: z.string().uuid(),
  }).parse({
    storeId: formData.get("storeId"),
    sectionId: formData.get("sectionId"),
  });

  const { supabase, store } = await getStoreForSection(input.storeId);

  const { error } = await supabase
    .from("store_sections")
    .delete()
    .eq("id", input.sectionId)
    .eq("store_id", store.id);

  if (error) throw new Error("Unable to delete store section.");

  revalidatePath(`/admin/stores/${store.id}/builder`);
  revalidatePath(`/shop/${store.slug}`);
}
