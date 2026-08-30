"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrganizationMembership } from "@/lib/auth";

export async function saveCustomDomain(formData: FormData) {
  const { supabase, organizationIds } = await requireOrganizationMembership();

  const input = z.object({
    organizationId: z.string().uuid(),
    storeId: z.string().uuid(),
    hostname: z.string().trim().min(3).max(253),
  }).parse({
    organizationId: formData.get("organizationId"),
    storeId: formData.get("storeId"),
    hostname: formData.get("hostname"),
  });

  if (!organizationIds.includes(input.organizationId)) {
    throw new Error("You do not have access to this organization.");
  }

  const { error } = await supabase.rpc("save_store_domain_request_v1", {
    target_store_id: input.storeId,
    requested_hostname: input.hostname,
  });

  if (error) throw new Error(error.message);
  redirect(`/portal/settings?organization=${input.organizationId}&saved=domain`);
}

export async function savePayoutDetails(formData: FormData) {
  const { supabase, organizationIds } = await requireOrganizationMembership();

  const organizationId = z.string().uuid().parse(formData.get("organizationId"));
  const method = z.enum(["ach","paypal","zelle"]).parse(formData.get("payoutMethod"));

  if (!organizationIds.includes(organizationId)) {
    throw new Error("You do not have access to this organization.");
  }

  let details: Record<string,string>;

  if (method === "ach") {
    details = {
      accountHolderName: String(formData.get("accountHolderName") ?? "").trim(),
      accountType: String(formData.get("accountType") ?? "checking"),
      routingNumber: String(formData.get("routingNumber") ?? "").trim(),
      accountNumber: String(formData.get("accountNumber") ?? "").trim(),
    };
  } else if (method === "paypal") {
    details = {
      email: String(formData.get("paypalEmail") ?? "").trim(),
    };
  } else {
    details = {
      email: String(formData.get("zelleEmail") ?? "").trim(),
      phone: String(formData.get("zellePhone") ?? "").trim(),
    };
  }

  const { error } = await supabase.rpc("save_organization_payout_details_v1", {
    target_organization_id: organizationId,
    payout_method_input: method,
    payout_details: details,
  });

  if (error) throw new Error(error.message);
  redirect(`/portal/settings?organization=${organizationId}&saved=payout`);
}
