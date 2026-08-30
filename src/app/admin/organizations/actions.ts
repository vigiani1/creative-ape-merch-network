"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

const CreateOrganization = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  organizationType: z.enum(["business", "school", "sports_team", "club", "nonprofit", "event", "other"]),
  revenueShareRate: z.coerce.number().min(0).max(100),
});

export async function createOrganization(formData: FormData) {
  const { supabase } = await requireSuperAdmin();

  const input = CreateOrganization.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    organizationType: formData.get("organizationType"),
    revenueShareRate: formData.get("revenueShareRate"),
  });

  const { error } = await supabase.from("organizations").insert({
    name: input.name,
    slug: input.slug,
    organization_type: input.organizationType,
    default_revenue_share_rate: input.revenueShareRate,
    status: "active",
  });

  if (error) {
    throw new Error(error.code === "23505" ? "That organization slug is already in use." : "Unable to create organization.");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/organizations");
  redirect("/admin/organizations");
}
const UpdateOrganization = CreateOrganization.extend({
  id: z.string().uuid(),
  status: z.enum(["active", "inactive", "archived"]),
});

export async function updateOrganization(formData: FormData) {
  const { supabase } = await requireSuperAdmin();

  const input = UpdateOrganization.parse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    organizationType: formData.get("organizationType"),
    revenueShareRate: formData.get("revenueShareRate"),
    status: formData.get("status"),
  });

  const { error } = await supabase
    .from("organizations")
    .update({
      name: input.name,
      slug: input.slug,
      organization_type: input.organizationType,
      default_revenue_share_rate: input.revenueShareRate,
      status: input.status,
    })
    .eq("id", input.id);

  if (error) throw new Error(error.code === "23505" ? "That organization slug is already in use." : "Unable to update organization.");

  revalidatePath("/admin");
  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${input.id}`);
  redirect("/admin/organizations");
}


const RepresentativeInput = z.object({
  organizationId: z.string().uuid(),
  representativeId: z.string().uuid().optional(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email().max(200),
  addressLine1: z.string().trim().max(160).optional(),
  addressLine2: z.string().trim().max(160).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(30).optional(),
  country: z.string().trim().min(2).max(2),
  permissionTier: z.enum(["viewer","store_manager","organization_admin"]),
  active: z.boolean(),
});

function parseRepresentative(formData: FormData) {
  return RepresentativeInput.parse({
    organizationId: formData.get("organizationId"),
    representativeId: String(formData.get("representativeId") ?? "") || undefined,
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: String(formData.get("phone") ?? "") || undefined,
    email: formData.get("email"),
    addressLine1: String(formData.get("addressLine1") ?? "") || undefined,
    addressLine2: String(formData.get("addressLine2") ?? "") || undefined,
    city: String(formData.get("city") ?? "") || undefined,
    state: String(formData.get("state") ?? "") || undefined,
    postalCode: String(formData.get("postalCode") ?? "") || undefined,
    country: String(formData.get("country") ?? "US").toUpperCase(),
    permissionTier: formData.get("permissionTier"),
    active: formData.get("active") === "on",
  });
}

function representativeValues(input: z.infer<typeof RepresentativeInput>) {
  return {
    organization_id: input.organizationId,
    first_name: input.firstName,
    last_name: input.lastName,
    phone: input.phone ?? null,
    email: input.email,
    address_line1: input.addressLine1 ?? null,
    address_line2: input.addressLine2 ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    postal_code: input.postalCode ?? null,
    country: input.country,
    permission_tier: input.permissionTier,
    active: input.active,
  };
}

export async function createOrganizationRepresentative(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = parseRepresentative(formData);
  const { error } = await supabase.from("organization_representatives").insert(representativeValues(input));
  if (error) {
    if (error.code === "23505") throw new Error("That representative email is already assigned to this organization.");
    if (error.message.includes("at most 3")) throw new Error("This organization already has 3 active representatives.");
    throw new Error("Unable to add representative.");
  }
  revalidatePath(`/admin/organizations/${input.organizationId}`);
}

export async function updateOrganizationRepresentative(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = parseRepresentative(formData);
  if (!input.representativeId) throw new Error("Representative ID is required.");
  const { error } = await supabase
    .from("organization_representatives")
    .update(representativeValues(input))
    .eq("id", input.representativeId)
    .eq("organization_id", input.organizationId);
  if (error) {
    if (error.message.includes("at most 3")) throw new Error("This organization already has 3 active representatives.");
    throw new Error("Unable to update representative.");
  }
  revalidatePath(`/admin/organizations/${input.organizationId}`);
}

export async function deleteOrganizationRepresentative(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = z.object({
    organizationId: z.string().uuid(),
    representativeId: z.string().uuid(),
  }).parse({
    organizationId: formData.get("organizationId"),
    representativeId: formData.get("representativeId"),
  });
  const { error } = await supabase
    .from("organization_representatives")
    .delete()
    .eq("id", input.representativeId)
    .eq("organization_id", input.organizationId);
  if (error) throw new Error("Unable to remove representative.");
  revalidatePath(`/admin/organizations/${input.organizationId}`);
}

const RevenueRuleInput = z.object({
  organizationId: z.string().uuid(),
  storeId: z.union([z.literal(""), z.string().uuid()]),
  label: z.string().trim().max(120).optional(),
  ruleType: z.enum(["gross_percent","net_profit_percent","fixed_per_item","fixed_per_order","campaign_threshold"]),
  rate: z.union([z.literal(""), z.coerce.number().min(0).max(100)]),
  fixedAmount: z.union([z.literal(""), z.coerce.number().min(0).max(1000000)]),
  salesThreshold: z.union([z.literal(""), z.coerce.number().min(0).max(100000000)]),
  shareCap: z.union([z.literal(""), z.coerce.number().min(0).max(100000000)]),
  priority: z.coerce.number().int().min(0).max(999),
});

function dollarsToRuleCents(value: "" | number) {
  return value === "" ? null : Math.round(value * 100);
}

export async function createRevenueShareRule(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = RevenueRuleInput.parse({
    organizationId: formData.get("organizationId"),
    storeId: String(formData.get("storeId") ?? ""),
    label: String(formData.get("label") ?? "") || undefined,
    ruleType: formData.get("ruleType"),
    rate: String(formData.get("rate") ?? ""),
    fixedAmount: String(formData.get("fixedAmount") ?? ""),
    salesThreshold: String(formData.get("salesThreshold") ?? ""),
    shareCap: String(formData.get("shareCap") ?? ""),
    priority: formData.get("priority") ?? 0,
  });

  if (["gross_percent","net_profit_percent"].includes(input.ruleType) && input.rate === "") {
    throw new Error("A percentage rate is required for this rule.");
  }
  if (["fixed_per_item","fixed_per_order","campaign_threshold"].includes(input.ruleType) && input.fixedAmount === "") {
    throw new Error("A fixed amount is required for this rule.");
  }
  if (input.ruleType === "campaign_threshold" && input.salesThreshold === "") {
    throw new Error("A gross-sales threshold is required for a campaign threshold payout.");
  }

  const { error } = await supabase.from("revenue_share_rules").insert({
    organization_id: input.organizationId,
    store_id: input.storeId || null,
    product_id: null,
    label: input.label ?? null,
    rule_type: input.ruleType,
    rate: input.rate === "" ? null : input.rate,
    fixed_amount: dollarsToRuleCents(input.fixedAmount),
    sales_threshold: dollarsToRuleCents(input.salesThreshold),
    share_cap: dollarsToRuleCents(input.shareCap),
    priority: input.priority,
  });
  if (error) throw new Error("Unable to create revenue-share rule.");
  revalidatePath(`/admin/organizations/${input.organizationId}`);
}

export async function deleteRevenueShareRule(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = z.object({ organizationId: z.string().uuid(), ruleId: z.string().uuid() }).parse({
    organizationId: formData.get("organizationId"),
    ruleId: formData.get("ruleId"),
  });
  const { error } = await supabase.from("revenue_share_rules")
    .delete().eq("id", input.ruleId).eq("organization_id", input.organizationId);
  if (error) throw new Error("Unable to delete revenue-share rule.");
  revalidatePath(`/admin/organizations/${input.organizationId}`);
}
