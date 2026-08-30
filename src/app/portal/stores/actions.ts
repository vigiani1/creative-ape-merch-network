"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrganizationMembership } from "@/lib/auth";

export async function applyOrganizationLayout(formData: FormData) {
  const { supabase, organizationIds } = await requireOrganizationMembership();
  const input = z.object({
    storeId: z.string().uuid(),
    templateId: z.string().uuid(),
  }).parse({
    storeId: formData.get("storeId"),
    templateId: formData.get("templateId"),
  });

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id,organization_id,slug")
    .eq("id", input.storeId)
    .single();

  if (storeError || !store || !organizationIds.includes(store.organization_id)) {
    throw new Error("Store not found.");
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in required.");

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", store.organization_id)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (membershipError || membership?.role !== "admin") {
    throw new Error("Only an Organization Admin can change the saved storefront layout.");
  }

  const { error } = await supabase.rpc("apply_store_layout_template", {
    target_store_id: store.id,
    target_template_id: input.templateId,
  });

  if (error) throw new Error(error.message || "Unable to apply layout.");
  revalidatePath("/portal/stores");
  revalidatePath(`/shop/${store.slug}`);
}
