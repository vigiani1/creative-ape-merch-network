"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const AddMember = z.object({
  organizationId: z.string().uuid(),
  email: z.string().trim().email().max(320),
  role: z.enum(["admin", "viewer"]),
});

const RemoveMember = z.object({
  membershipId: z.string().uuid(),
});

export async function addOrganizationMember(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = AddMember.parse({
    organizationId: formData.get("organizationId"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  const admin = createAdminClient();
  let page = 1;
  let targetUserId: string | null = null;

  while (page <= 10 && !targetUserId) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error("Unable to search Supabase Auth users.");

    const match = data.users.find((user) => user.email?.toLowerCase() === input.email.toLowerCase());
    if (match) targetUserId = match.id;
    if (data.users.length < 100) break;
    page += 1;
  }

  if (!targetUserId) throw new Error("No existing signed-up user was found with that email.");

  const { error } = await supabase.from("organization_members").upsert(
    {
      organization_id: input.organizationId,
      user_id: targetUserId,
      role: input.role,
    },
    { onConflict: "organization_id,user_id" }
  );

  if (error) throw new Error("Unable to add organization member.");

  revalidatePath("/admin/members");
  revalidatePath("/portal");
}

export async function removeOrganizationMember(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = RemoveMember.parse({ membershipId: formData.get("membershipId") });

  const { error } = await supabase.from("organization_members").delete().eq("id", input.membershipId);
  if (error) throw new Error("Unable to remove organization member.");

  revalidatePath("/admin/members");
}
