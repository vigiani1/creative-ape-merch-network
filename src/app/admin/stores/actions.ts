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
