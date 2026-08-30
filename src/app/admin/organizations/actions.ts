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
