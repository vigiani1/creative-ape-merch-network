"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

export async function updateDomainStatus(formData: FormData) {
  const { supabase } = await requireSuperAdmin();

  const input = z.object({
    domainId: z.string().uuid(),
    status: z.enum(["pending","dns_required","verifying","active","error","removed"]),
    message: z.string().trim().max(1000).optional(),
  }).parse({
    domainId: formData.get("domainId"),
    status: formData.get("status"),
    message: String(formData.get("message") ?? "") || undefined,
  });

  const { error } = await supabase.rpc("update_store_domain_status_v1", {
    target_domain_id: input.domainId,
    status_input: input.status,
    verification_message_input: input.message,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
}


export async function saveShippingSettings(formData: FormData) {
  const { supabase } = await requireSuperAdmin();

  const provider = z.enum(["manual","shippo","easypost","shipengine"]).parse(formData.get("provider"));
  const apiKey = String(formData.get("apiKey") ?? "").trim();

  const origin = {
    name: String(formData.get("originName") ?? "").trim(),
    company: String(formData.get("originCompany") ?? "").trim(),
    phone: String(formData.get("originPhone") ?? "").trim(),
    email: String(formData.get("originEmail") ?? "").trim(),
    address1: String(formData.get("originAddress1") ?? "").trim(),
    address2: String(formData.get("originAddress2") ?? "").trim(),
    city: String(formData.get("originCity") ?? "").trim(),
    state: String(formData.get("originState") ?? "").trim(),
    postalCode: String(formData.get("originPostalCode") ?? "").trim(),
    country: String(formData.get("originCountry") ?? "US").trim() || "US",
  };

  const packageData = {
    name: String(formData.get("packageName") ?? "Apparel Mailer").trim() || "Apparel Mailer",
    length: Number(formData.get("packageLength") ?? 12),
    width: Number(formData.get("packageWidth") ?? 10),
    height: Number(formData.get("packageHeight") ?? 2),
    weightOz: Number(formData.get("packageWeightOz") ?? 8),
  };

  const dollarsToCents = (value: FormDataEntryValue | null, fallback = 0) => {
    const number = Number(value ?? fallback);
    return Number.isFinite(number) ? Math.max(0, Math.round(number * 100)) : fallback;
  };

  const thresholdRaw = String(formData.get("freeShippingThreshold") ?? "").trim();
  const allowedServices = formData.getAll("allowedServices").map(String).filter(Boolean);

  const rules = {
    freeShippingThresholdCents: thresholdRaw ? dollarsToCents(thresholdRaw) : null,
    handlingFeeCents: dollarsToCents(formData.get("handlingFee")),
    fallbackRateCents: dollarsToCents(formData.get("fallbackRate"), 895),
    allowedServices,
  };

  const { error } = await supabase.rpc("save_super_admin_shipping_settings_v1", {
    provider_input: provider,
    api_key_input: apiKey || undefined,
    origin_input: origin,
    package_input: packageData,
    rules_input: rules,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
}
