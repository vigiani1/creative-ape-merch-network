"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

export async function saveCategory(formData: FormData) {
  const { supabase } = await requireSuperAdmin();

  const input = z.object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).optional(),
    usesSize: z.boolean(),
    usesColor: z.boolean(),
    active: z.boolean(),
    defaultSizes: z.string(),
    defaultColors: z.string(),
  }).parse({
    id: String(formData.get("id") ?? "") || undefined,
    name: formData.get("name"),
    description: String(formData.get("description") ?? "") || undefined,
    usesSize: formData.get("usesSize") === "on",
    usesColor: formData.get("usesColor") === "on",
    active: formData.get("active") === "on",
    defaultSizes: String(formData.get("defaultSizes") ?? ""),
    defaultColors: String(formData.get("defaultColors") ?? ""),
  });

  const sizes=input.defaultSizes.split(",").map((v)=>v.trim()).filter(Boolean);
  const colors=input.defaultColors.split(",").map((v)=>v.trim()).filter(Boolean);

  const { error } = await supabase.rpc("save_product_category_v2", {
    target_category_id: input.id,
    category_name: input.name,
    category_description: input.description,
    uses_size_input: input.usesSize,
    uses_color_input: input.usesColor,
    default_sizes_input: sizes,
    default_colors_input: colors,
    active_input: input.active,
  });

  if(error) throw new Error(error.message);
  revalidatePath("/admin/products/taxonomy");
}

export async function saveCollection(formData: FormData) {
  const { supabase } = await requireSuperAdmin();

  const input=z.object({
    id:z.string().uuid().optional(),
    organizationId:z.string().uuid(),
    name:z.string().trim().min(2).max(120),
    description:z.string().trim().max(1000).optional(),
    type:z.enum(["merchandising","school","team","organization","event","seasonal","featured"]),
    imageUrl:z.string().trim().max(1000).optional(),
    status:z.enum(["active","draft","archived"]),
    displayOrder:z.coerce.number().int().min(0).max(999),
  }).parse({
    id:String(formData.get("id") ?? "") || undefined,
    organizationId:formData.get("organizationId"),
    name:formData.get("name"),
    description:String(formData.get("description") ?? "") || undefined,
    type:formData.get("type"),
    imageUrl:String(formData.get("imageUrl") ?? "") || undefined,
    status:formData.get("status"),
    displayOrder:formData.get("displayOrder") ?? "0",
  });

  const { error }=await supabase.rpc("save_admin_collection_v2",{
    target_collection_id:input.id,
    target_organization_id:input.organizationId,
    collection_name:input.name,
    collection_description:input.description,
    collection_type_input:input.type,
    image_url_input:input.imageUrl,
    status_input:input.status,
    display_order_input:input.displayOrder,
  });

  if(error) throw new Error(error.message);
  revalidatePath("/admin/products/taxonomy");
}
