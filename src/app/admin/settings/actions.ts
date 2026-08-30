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
