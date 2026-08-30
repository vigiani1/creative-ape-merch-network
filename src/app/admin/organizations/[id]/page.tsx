import Link from "next/link";
import { notFound } from "next/navigation";
import { updateOrganization } from "../actions";
import { requireSuperAdmin } from "@/lib/auth";

export default async function OrganizationEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireSuperAdmin();

  const { data: org, error } = await supabase
    .from("organizations")
    .select("id,name,slug,organization_type,status,default_revenue_share_rate")
    .eq("id", id)
    .maybeSingle();

  if (error || !org) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/organizations" className="text-sm font-semibold underline">Back to organizations</Link>
      <form action={updateOrganization} className="mt-5 grid gap-4 rounded-2xl border border-black/10 bg-white p-6">
        <input type="hidden" name="id" value={org.id} />
        <h1 className="text-2xl font-black">Edit organization</h1>

        <label className="grid gap-2 text-sm font-semibold">Name
          <input name="name" defaultValue={org.name} required maxLength={120} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
        </label>

        <label className="grid gap-2 text-sm font-semibold">Slug
          <input name="slug" defaultValue={org.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
        </label>

        <label className="grid gap-2 text-sm font-semibold">Type
          <select name="organizationType" defaultValue={org.organization_type} className="rounded-xl border border-black/15 px-4 py-3 font-normal">
            <option value="business">Business</option><option value="school">School</option><option value="sports_team">Sports team</option><option value="club">Club</option><option value="nonprofit">Nonprofit</option><option value="event">Event</option><option value="other">Other</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold">Status
          <select name="status" defaultValue={org.status} className="rounded-xl border border-black/15 px-4 py-3 font-normal">
            <option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold">Default revenue share %
          <input name="revenueShareRate" type="number" min="0" max="100" step="0.01" defaultValue={Number(org.default_revenue_share_rate)} required className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
        </label>

        <button type="submit" className="rounded-xl bg-black px-5 py-3 font-bold text-white">Save changes</button>
      </form>
    </div>
  );
}
