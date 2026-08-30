import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OrganizationMembership = {
  organization_id: string;
  role: "admin" | "viewer";
};

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login");
  return { supabase, userId: String(data.claims.sub) };
}

export async function requireSuperAdmin() {
  const auth = await requireUser();
  const { data, error } = await auth.supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", auth.userId)
    .maybeSingle();

  if (error || data?.platform_role !== "super_admin") redirect("/access-denied");
  return auth;
}

export async function requireOrganizationMembership() {
  const auth = await requireUser();
  const { data, error } = await auth.supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", auth.userId);

  if (error || !data?.length) redirect("/access-denied");

  return {
    ...auth,
    memberships: data as OrganizationMembership[],
    organizationIds: data.map((membership) => membership.organization_id),
  };
}
