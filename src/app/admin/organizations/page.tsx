import { createOrganization } from "./actions";
import { requireSuperAdmin } from "@/lib/auth";

function formatType(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function OrganizationsPage() {
  const { supabase } = await requireSuperAdmin();
  const { data: organizations, error } = await supabase
    .from("organizations")
    .select("id,name,slug,organization_type,status,default_revenue_share_rate,created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load organizations.");

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-black/45">Tenants</p>
            <h2 className="mt-1 text-2xl font-black">Organizations</h2>
          </div>
          <p className="text-sm text-black/50">{organizations?.length ?? 0} total</p>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-black/10 text-black/45">
              <tr>
                <th className="py-3 pr-4 font-semibold">Organization</th>
                <th className="py-3 pr-4 font-semibold">Type</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 pr-4 font-semibold">Default share</th>
                <th className="py-3 font-semibold">Store slug base</th>
              </tr>
            </thead>
            <tbody>
              {(organizations ?? []).map((org) => (
                <tr key={org.id} className="border-b border-black/5 last:border-0">
                  <td className="py-4 pr-4">
                    <p className="font-bold">{org.name}</p>
                    <p className="mt-1 text-xs text-black/45">{org.slug}</p>
                  </td>
                  <td className="py-4 pr-4">{formatType(org.organization_type)}</td>
                  <td className="py-4 pr-4">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{org.status}</span>
                  </td>
                  <td className="py-4 pr-4">{Number(org.default_revenue_share_rate)}%</td>
                  <td className="py-4 font-mono text-xs text-black/55">{org.slug}</td>
                </tr>
              ))}
              {!organizations?.length && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-black/45">No organizations yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-sm font-semibold text-black/45">New tenant</p>
        <h2 className="mt-1 text-2xl font-black">Create organization</h2>
        <p className="mt-2 text-sm text-black/55">Create the tenant first. Stores, products, branding, and member access are attached afterward.</p>

        <form action={createOrganization} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">
            Organization name
            <input name="name" required minLength={2} maxLength={120} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="Example High School" />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Slug
            <input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="example-high-school" />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Organization type
            <select name="organizationType" defaultValue="business" className="rounded-xl border border-black/15 px-4 py-3 font-normal">
              <option value="business">Business</option>
              <option value="school">School</option>
              <option value="sports_team">Sports team</option>
              <option value="club">Club</option>
              <option value="nonprofit">Nonprofit</option>
              <option value="event">Event</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Default revenue share %
            <input name="revenueShareRate" type="number" min="0" max="100" step="0.01" defaultValue="20" required className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
          </label>

          <button type="submit" className="mt-2 rounded-xl bg-black px-5 py-3 font-bold text-white">Create organization</button>
        </form>
      </aside>
    </div>
  );
}
