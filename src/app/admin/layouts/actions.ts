"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

const CaptureLayout = z.object({
  storeId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  description: z.string().trim().max(1000).optional(),
  previewImageUrl: z.string().trim().max(1000).optional(),
});

export async function captureStoreAsLayout(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = CaptureLayout.parse({
    storeId: formData.get("storeId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: String(formData.get("description") ?? "") || undefined,
    previewImageUrl: String(formData.get("previewImageUrl") ?? "") || undefined,
  });

  const [
    { data: store, error: storeError },
    { data: homeSections, error: homeError },
    { data: pages, error: pageError },
    { data: pageSections, error: pageSectionsError },
    { data: theme, error: themeError },
  ] = await Promise.all([
    supabase.from("stores").select("id,name,organization_id").eq("id", input.storeId).single(),
    supabase.from("store_sections").select("section_type,position,is_enabled,settings").eq("store_id", input.storeId).order("position"),
    supabase.from("store_pages").select("id,slug,title,nav_label,page_type,position,is_enabled,show_in_navigation").eq("store_id", input.storeId).order("position"),
    supabase.from("store_page_sections").select("page_id,section_type,position,is_enabled,settings").eq("store_id", input.storeId).order("position"),
    supabase.from("store_themes").select("logo_url,hero_image_url,primary_color,secondary_color,accent_color,background_color,text_color").eq("store_id", input.storeId).maybeSingle(),
  ]);

  if (storeError || !store || homeError || pageError || pageSectionsError || themeError) {
    throw new Error("Unable to capture this store layout.");
  }

  const pagesWithSections = (pages ?? []).map((page) => ({
    slug: page.slug,
    title: page.title,
    nav_label: page.nav_label,
    page_type: page.page_type,
    position: page.position,
    is_enabled: page.is_enabled,
    show_in_navigation: page.show_in_navigation,
    sections: (pageSections ?? [])
      .filter((section) => section.page_id === page.id)
      .map((section) => ({
        section_type: section.section_type,
        position: section.position,
        is_enabled: section.is_enabled,
        settings: section.settings,
      })),
  }));

  const layoutJson = {
    version: 1,
    source_store_name: store.name,
    home_sections: homeSections ?? [],
    pages: pagesWithSections,
  };

  const themeJson = theme ?? {};

  const { error } = await supabase.from("store_layout_templates").insert({
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    preview_image_url: input.previewImageUrl ?? null,
    layout_json: layoutJson,
    theme_json: themeJson,
    active: true,
  });

  if (error) throw new Error(error.code === "23505" ? "That layout slug already exists." : "Unable to save layout template.");

  revalidatePath("/admin/layouts");
}

export async function setLayoutTemplateActive(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = z.object({ id: z.string().uuid(), active: z.boolean() }).parse({
    id: formData.get("id"),
    active: formData.get("active") === "on",
  });

  const { error } = await supabase.from("store_layout_templates").update({ active: input.active }).eq("id", input.id);
  if (error) throw new Error("Unable to update layout template.");
  revalidatePath("/admin/layouts");
  revalidatePath("/portal/stores");
}

export async function applyLayoutToStore(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = z.object({ storeId: z.string().uuid(), templateId: z.string().uuid() }).parse({
    storeId: formData.get("storeId"),
    templateId: formData.get("templateId"),
  });

  const { error } = await supabase.rpc("apply_store_layout_template", {
    target_store_id: input.storeId,
    target_template_id: input.templateId,
  });

  if (error) throw new Error(error.message || "Unable to apply layout.");
  revalidatePath("/admin/layouts");
  revalidatePath(`/admin/stores/${input.storeId}/builder`);
  revalidatePath(`/admin/stores/${input.storeId}/pages`);
}
