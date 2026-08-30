"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

const CategoryInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  description: z.string().trim().max(1000).optional(),
  usesVariantGroup: z.boolean(),
  variantGroupLabel: z.string().trim().max(80),
  usesSize: z.boolean(),
  sizeLabel: z.string().trim().max(80),
  usesColor: z.boolean(),
  colorLabel: z.string().trim().max(80),
  defaultVariantGroups: z.string().max(2000),
  defaultSizes: z.string().max(2000),
  defaultColors: z.string().max(2000),
  active: z.boolean(),
});

function list(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function parse(formData: FormData) {
  return CategoryInput.parse({
    id: String(formData.get("id") ?? "") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: String(formData.get("description") ?? "") || undefined,
    usesVariantGroup: formData.get("usesVariantGroup") === "on",
    variantGroupLabel: String(formData.get("variantGroupLabel") ?? "Style"),
    usesSize: formData.get("usesSize") === "on",
    sizeLabel: String(formData.get("sizeLabel") ?? "Size"),
    usesColor: formData.get("usesColor") === "on",
    colorLabel: String(formData.get("colorLabel") ?? "Color"),
    defaultVariantGroups: String(formData.get("defaultVariantGroups") ?? ""),
    defaultSizes: String(formData.get("defaultSizes") ?? ""),
    defaultColors: String(formData.get("defaultColors") ?? ""),
    active: formData.get("active") === "on",
  });
}

function values(input: z.infer<typeof CategoryInput>) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    uses_variant_group: input.usesVariantGroup,
    variant_group_label: input.variantGroupLabel || "Style",
    uses_size: input.usesSize,
    size_label: input.sizeLabel || "Size",
    uses_color: input.usesColor,
    color_label: input.colorLabel || "Color",
    default_variant_groups: list(input.defaultVariantGroups),
    default_sizes: list(input.defaultSizes),
    default_colors: list(input.defaultColors),
    active: input.active,
  };
}

export async function createProductCategory(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = parse(formData);
  const { error } = await supabase.from("product_categories").insert(values(input));
  if (error) throw new Error(error.code === "23505" ? "That category name or slug already exists." : "Unable to create category.");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/onboarding");
}

export async function updateProductCategory(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = parse(formData);
  if (!input.id) throw new Error("Category ID is required.");
  const { error } = await supabase.from("product_categories").update(values(input)).eq("id", input.id);
  if (error) throw new Error(error.code === "23505" ? "That category name or slug already exists." : "Unable to update category.");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/onboarding");
}


const CategoryFieldInput = z.object({
  categoryId: z.string().uuid(),
  fieldId: z.string().uuid().optional(),
  fieldKey: z.string().trim().toLowerCase().regex(/^[a-z0-9_]+$/).max(80),
  label: z.string().trim().min(1).max(120),
  fieldType: z.enum(["text","number","select","boolean","textarea"]),
  fieldGroup: z.string().trim().min(1).max(120),
  required: z.boolean(),
  adminOnly: z.boolean(),
  hidden: z.boolean(),
  displayOrder: z.coerce.number().int().min(0).max(999),
  options: z.string().max(4000),
  placeholder: z.string().trim().max(200).optional(),
  helpText: z.string().trim().max(500).optional(),
});

function parseCategoryField(formData: FormData) {
  return CategoryFieldInput.parse({
    categoryId: formData.get("categoryId"),
    fieldId: String(formData.get("fieldId") ?? "") || undefined,
    fieldKey: formData.get("fieldKey"),
    label: formData.get("label"),
    fieldType: formData.get("fieldType"),
    fieldGroup: String(formData.get("fieldGroup") ?? "Product details"),
    required: formData.get("required") === "on",
    adminOnly: formData.get("adminOnly") === "on",
    hidden: formData.get("hidden") === "on",
    displayOrder: formData.get("displayOrder") ?? 0,
    options: String(formData.get("options") ?? ""),
    placeholder: String(formData.get("placeholder") ?? "") || undefined,
    helpText: String(formData.get("helpText") ?? "") || undefined,
  });
}

function categoryFieldValues(input: z.infer<typeof CategoryFieldInput>) {
  return {
    category_id: input.categoryId,
    field_key: input.fieldKey,
    label: input.label,
    field_type: input.fieldType,
    field_group: input.fieldGroup,
    required: input.required,
    admin_only: input.adminOnly,
    hidden: input.hidden,
    display_order: input.displayOrder,
    options: list(input.options),
    placeholder: input.placeholder ?? null,
    help_text: input.helpText ?? null,
    updated_at: new Date().toISOString(),
  };
}

export async function createProductCategoryField(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = parseCategoryField(formData);
  const { error } = await supabase.from("product_category_fields").insert(categoryFieldValues(input));
  if (error) throw new Error(error.code === "23505" ? "That field key is already used in this category." : "Unable to create category field.");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/onboarding");
}

export async function updateProductCategoryField(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = parseCategoryField(formData);
  if (!input.fieldId) throw new Error("Field ID is required.");
  const { error } = await supabase.from("product_category_fields")
    .update(categoryFieldValues(input))
    .eq("id", input.fieldId)
    .eq("category_id", input.categoryId);
  if (error) throw new Error(error.code === "23505" ? "That field key is already used in this category." : "Unable to update category field.");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/onboarding");
}

export async function deleteProductCategoryField(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = z.object({ categoryId:z.string().uuid(), fieldId:z.string().uuid() }).parse({
    categoryId: formData.get("categoryId"),
    fieldId: formData.get("fieldId"),
  });
  const { error } = await supabase.from("product_category_fields")
    .delete()
    .eq("id", input.fieldId)
    .eq("category_id", input.categoryId);
  if (error) throw new Error("Unable to delete category field.");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/onboarding");
}


const StandardCategoryPreset = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  preset: z.enum(["apparel","headwear","drinkware","simple"]),
});

export async function createStandardCategory(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = StandardCategoryPreset.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    preset: formData.get("preset"),
  });

  const presets = {
    apparel: {
      description: "Standard apparel with customer-selectable size and color.",
      uses_variant_group: false,
      variant_group_label: "Style",
      uses_size: true,
      size_label: "Size",
      uses_color: true,
      color_label: "Color",
      default_variant_groups: [] as string[],
      default_sizes: ["Small","Medium","Large","XL","2XL","3XL","4XL"],
      default_colors: [] as string[],
    },
    headwear: {
      description: "Headwear with style, size, and color options.",
      uses_variant_group: true,
      variant_group_label: "Hat style",
      uses_size: true,
      size_label: "Size",
      uses_color: true,
      color_label: "Color",
      default_variant_groups: ["Fitted","Snapback","Flexfit","Velcro","Visor","Straw Hat"],
      default_sizes: ["S","M","L","XL"],
      default_colors: [] as string[],
    },
    drinkware: {
      description: "Drinkware with capacity and color options.",
      uses_variant_group: false,
      variant_group_label: "Style",
      uses_size: true,
      size_label: "Capacity",
      uses_color: true,
      color_label: "Color",
      default_variant_groups: [] as string[],
      default_sizes: ["12 oz","16 oz","20 oz","24 oz","32 oz"],
      default_colors: [] as string[],
    },
    simple: {
      description: "Simple product with no required customer option groups.",
      uses_variant_group: false,
      variant_group_label: "Style",
      uses_size: false,
      size_label: "Size",
      uses_color: false,
      color_label: "Color",
      default_variant_groups: [] as string[],
      default_sizes: [] as string[],
      default_colors: [] as string[],
    },
  } as const;

  const { error } = await supabase.from("product_categories").insert({
    name: input.name,
    slug: input.slug,
    ...presets[input.preset],
    active: true,
  });

  if (error) throw new Error(error.code === "23505" ? "That category name or slug already exists." : "Unable to create standard category.");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/onboarding");
}
