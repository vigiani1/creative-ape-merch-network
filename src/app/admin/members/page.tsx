import { addOrganizationMember, removeOrganizationMember } from "./actions";
import { requireSuperAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function MembersPage() {
  const { supabase } = await requireSuperAdmin();

  const [{ data: organizations, error: orgError }, { data: memberships, error: memberError }] = await Promise.all([
    supabase.from("organizations").select("id,name,status").neq("status", "archived").order("name"),
    supabase
      .from("organization_members")
      .select("id,organization_id,user_id,role,created_at,organizations(name)")
      .order("created_at", { ascending: false }),
  ]);

  if (orgError || memberError) throw new Error("Unable to load member access.");

  const admin = createAdminClient();
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authError) throw new Error("Unable to load Supabase Auth users.");

  const emails = new Map(authData.users.map((user) => [user.id, user.email ?? "No email"]));

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <div>
          <p className="text-sm font-semibold text-black/45">Access control</p>
          <h1 className="mt-1 text-2xl font-black">Organization members</h1>
          <p className="mt-2 text-sm text-black/55">Give existing signed-up users access to an organization portal as an admin or viewer.</p>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-black/10 text-black/45">
              <tr>
                <th className="py-3 pr-4 font-semibold">User</th>
                <th className="py-3 pr-4 font-semibold">Organization</th>
                <th className="py-3 pr-4 font-semibold">Role</th>
                <th className="py-3 font-semibold">Access</th>
              </tr>
            </thead>
            <tbody>
              {(memberships ?? []).map((membership) => {
                const org = Array.isArray(membership.organizations) ? membership.organizations[0] : membership.organizations;
                return (
                  <tr key={membership.id} className="border-b border-black/5 last:border-0">
                    <td className="py-4 pr-4">
                      <p className="font-semibold">{emails.get(membership.user_id) ?? "Unknown user"}</p>
                      <p className="mt-1 font-mono text-[11px] text-black/35">{membership.user_id}</p>
                    </td>
                    <td className="py-4 pr-4">{org?.name ?? "Unknown"}</td>
                    <td className="py-4 pr-4"><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{membership.role}</span></td>
                    <td className="py-4">
                      <form action={removeOrganizationMember}>
                        <input type="hidden" name="membershipId" value={membership.id} />
                        <button type="submit" className="font-semibold underline">Remove</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {!memberships?.length ? <tr><td colSpan={4} className="py-10 text-center text-black/45">No organization members yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-sm font-semibold text-black/45">Portal access</p>
        <h2 className="mt-1 text-2xl font-black">Add existing user</h2>
        <p className="mt-2 text-sm text-black/55">The person must already have a Supabase Auth account. Enter the same email they used to sign up.</p>

        <form action={addOrganizationMember} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">Organization
            <select name="organizationId" required defaultValue="" className="rounded-xl border border-black/15 px-4 py-3 font-normal">
              <option value="" disabled>Select organization</option>
              {(organizations ?? []).map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold">User email
            <input name="email" type="email" required maxLength={320} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="member@example.com" />
          </label>

          <label className="grid gap-2 text-sm font-semibold">Role
            <select name="role" defaultValue="viewer" className="rounded-xl border border-black/15 px-4 py-3 font-normal">
              <option value="viewer">Viewer</option>
              <option value="admin">Organization admin</option>
            </select>
          </label>

          <button type="submit" className="rounded-xl bg-black px-5 py-3 font-bold text-white">Grant portal access</button>
        </form>
      </aside>
    </div>
  );
}
