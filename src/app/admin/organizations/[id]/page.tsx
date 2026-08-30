import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createOrganizationRepresentative,
  createRevenueShareRule,
  deleteOrganizationRepresentative,
  deleteRevenueShareRule,
  updateOrganization,
  updateOrganizationRepresentative,
} from "../actions";
import { requireSuperAdmin } from "@/lib/auth";

function dollars(cents: number | null) {
  return cents == null ? "" : (cents / 100).toFixed(2);
}

function tierLabel(value: string) {
  if (value === "organization_admin") return "Organization Admin";
  if (value === "store_manager") return "Store Manager";
  return "Viewer";
}

export default async function OrganizationEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireSuperAdmin();

  const [
    { data: org, error: orgError },
    { data: reps, error: repsError },
    { data: stores, error: storesError },
    { data: rules, error: rulesError },
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id,name,slug,organization_number,organization_type,status,default_revenue_share_rate")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("organization_representatives")
      .select("*")
      .eq("organization_id", id)
      .order("created_at"),
    supabase
      .from("stores")
      .select("id,name,slug,status,availability_status,starts_at,ends_at")
      .eq("organization_id", id)
      .neq("status", "archived")
      .order("name"),
    supabase
      .from("revenue_share_rules")
      .select("id,label,store_id,rule_type,rate,fixed_amount,sales_threshold,share_cap,priority,effective_from,effective_to")
      .eq("organization_id", id)
      .order("priority", { ascending: false }),
  ]);

  if (orgError || repsError || storesError || rulesError || !org) notFound();

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/organizations" className="text-sm font-semibold underline">Back to organizations</Link>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black">CA-{String(org.organization_number).padStart(6, "0")}</span>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <form action={updateOrganization} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={org.id} />
          <h1 className="text-2xl font-black md:col-span-2">Organization settings</h1>

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

          <label className="grid gap-2 text-sm font-semibold">Fallback revenue share %
            <input name="revenueShareRate" type="number" min="0" max="100" step="0.01" defaultValue={Number(org.default_revenue_share_rate)} required className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
          </label>

          <div className="md:col-span-2">
            <button type="submit" className="rounded-xl bg-black px-5 py-3 font-bold text-white">Save organization</button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-black/45">Up to 3 active contacts</p>
            <h2 className="mt-1 text-2xl font-black">Organization representatives</h2>
          </div>
          <span className="text-sm text-black/45">{(reps ?? []).filter((rep) => rep.active).length}/3 active</span>
        </div>

        <div className="mt-5 grid gap-4">
          {(reps ?? []).map((rep) => (
            <form key={rep.id} action={updateOrganizationRepresentative} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 md:grid-cols-3">
              <input type="hidden" name="organizationId" value={org.id} />
              <input type="hidden" name="representativeId" value={rep.id} />
              <label className="grid gap-1 text-xs font-semibold">First name<input name="firstName" defaultValue={rep.first_name} required className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
              <label className="grid gap-1 text-xs font-semibold">Last name<input name="lastName" defaultValue={rep.last_name} required className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
              <label className="grid gap-1 text-xs font-semibold">Permission tier
                <select name="permissionTier" defaultValue={rep.permission_tier} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal">
                  <option value="viewer">Viewer</option>
                  <option value="store_manager">Store Manager</option>
                  <option value="organization_admin">Organization Admin</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold">Email<input name="email" type="email" defaultValue={rep.email} required className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
              <label className="grid gap-1 text-xs font-semibold">Phone<input name="phone" defaultValue={rep.phone ?? ""} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
              <label className="grid gap-1 text-xs font-semibold">Address line 1<input name="addressLine1" defaultValue={rep.address_line1 ?? ""} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
              <label className="grid gap-1 text-xs font-semibold">Address line 2<input name="addressLine2" defaultValue={rep.address_line2 ?? ""} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
              <label className="grid gap-1 text-xs font-semibold">City<input name="city" defaultValue={rep.city ?? ""} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
              <label className="grid gap-1 text-xs font-semibold">State<input name="state" defaultValue={rep.state ?? ""} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
              <label className="grid gap-1 text-xs font-semibold">Postal code<input name="postalCode" defaultValue={rep.postal_code ?? ""} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" /></label>
              <label className="grid gap-1 text-xs font-semibold">Country<input name="country" defaultValue={rep.country} maxLength={2} className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal uppercase" /></label>
              <label className="flex items-center gap-2 self-end text-xs font-semibold"><input name="active" type="checkbox" defaultChecked={rep.active} /> Active</label>
              <div className="flex gap-2 md:col-span-3">
                <button className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white">Save representative</button>
                <button formAction={deleteOrganizationRepresentative} className="rounded-lg border border-black/15 px-4 py-2 text-sm font-bold">Remove</button>
              </div>
              <p className="text-xs text-black/40 md:col-span-3">{tierLabel(rep.permission_tier)} controls only this organization’s allowed portal features, never Creative Ape master controls.</p>
            </form>
          ))}
        </div>

        {(reps ?? []).filter((rep) => rep.active).length < 3 ? (
          <form action={createOrganizationRepresentative} className="mt-5 grid gap-3 rounded-2xl border border-dashed border-black/20 p-4 md:grid-cols-3">
            <input type="hidden" name="organizationId" value={org.id} />
            <label className="grid gap-1 text-xs font-semibold">First name<input name="firstName" required className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
            <label className="grid gap-1 text-xs font-semibold">Last name<input name="lastName" required className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
            <label className="grid gap-1 text-xs font-semibold">Permission tier
              <select name="permissionTier" defaultValue="viewer" className="rounded-lg border border-black/15 px-3 py-2 font-normal">
                <option value="viewer">Viewer</option><option value="store_manager">Store Manager</option><option value="organization_admin">Organization Admin</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold">Email<input name="email" type="email" required className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
            <label className="grid gap-1 text-xs font-semibold">Phone<input name="phone" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
            <label className="grid gap-1 text-xs font-semibold">Address line 1<input name="addressLine1" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
            <label className="grid gap-1 text-xs font-semibold">Address line 2<input name="addressLine2" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
            <label className="grid gap-1 text-xs font-semibold">City<input name="city" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
            <label className="grid gap-1 text-xs font-semibold">State<input name="state" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
            <label className="grid gap-1 text-xs font-semibold">Postal code<input name="postalCode" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
            <label className="grid gap-1 text-xs font-semibold">Country<input name="country" defaultValue="US" maxLength={2} className="rounded-lg border border-black/15 px-3 py-2 font-normal uppercase" /></label>
            <label className="flex items-center gap-2 self-end text-xs font-semibold"><input name="active" type="checkbox" defaultChecked /> Active</label>
            <button className="w-fit rounded-lg bg-black px-4 py-2 text-sm font-bold text-white md:col-span-3">Add representative</button>
          </form>
        ) : null}
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <div>
          <p className="text-sm font-semibold text-black/45">Organization / store payout logic</p>
          <h2 className="mt-1 text-2xl font-black">Revenue-share rules</h2>
          <p className="mt-2 text-sm text-black/55">Supports percent of gross sale, percent of net profit, fixed per item, fixed per order, and a one-time campaign payout when a gross-sales target is reached. Optional share caps prevent a rule from paying beyond a set total.</p>
        </div>

        <div className="mt-5 grid gap-3">
          {(rules ?? []).map((rule) => {
            const store = (stores ?? []).find((item) => item.id === rule.store_id);
            return (
              <div key={rule.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-neutral-50 p-4">
                <div>
                  <p className="font-black">{rule.label || rule.rule_type.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-xs text-black/45">
                    {store?.name ?? "All organization stores"} · priority {rule.priority}
                    {rule.rate != null ? ` · ${rule.rate}%` : ""}
                    {rule.fixed_amount != null ? ` · $${dollars(rule.fixed_amount)} fixed` : ""}
                    {rule.sales_threshold != null ? ` · target $${dollars(rule.sales_threshold)}` : ""}
                    {rule.share_cap != null ? ` · cap $${dollars(rule.share_cap)}` : ""}
                  </p>
                </div>
                <form action={deleteRevenueShareRule}>
                  <input type="hidden" name="organizationId" value={org.id} />
                  <input type="hidden" name="ruleId" value={rule.id} />
                  <button className="rounded-lg border border-black/15 px-3 py-2 text-xs font-bold">Delete</button>
                </form>
              </div>
            );
          })}
        </div>

        <form action={createRevenueShareRule} className="mt-5 grid gap-3 rounded-2xl border border-dashed border-black/20 p-4 md:grid-cols-3">
          <input type="hidden" name="organizationId" value={org.id} />
          <label className="grid gap-1 text-xs font-semibold">Rule label<input name="label" placeholder="Spring fundraiser payout" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
          <label className="grid gap-1 text-xs font-semibold">Applies to
            <select name="storeId" defaultValue="" className="rounded-lg border border-black/15 px-3 py-2 font-normal">
              <option value="">All organization stores</option>
              {(stores ?? []).map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold">Rule type
            <select name="ruleType" defaultValue="gross_percent" className="rounded-lg border border-black/15 px-3 py-2 font-normal">
              <option value="gross_percent">Percent of gross sale</option>
              <option value="net_profit_percent">Percent of net profit</option>
              <option value="fixed_per_item">Fixed amount per item</option>
              <option value="fixed_per_order">Fixed amount per order</option>
              <option value="campaign_threshold">Fixed payout at total-sales target</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold">Percentage %<input name="rate" type="number" min="0" max="100" step="0.01" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
          <label className="grid gap-1 text-xs font-semibold">Fixed amount $<input name="fixedAmount" type="number" min="0" step="0.01" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
          <label className="grid gap-1 text-xs font-semibold">Gross-sales target $<input name="salesThreshold" type="number" min="0" step="0.01" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
          <label className="grid gap-1 text-xs font-semibold">Total org-share cap $<input name="shareCap" type="number" min="0" step="0.01" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
          <label className="grid gap-1 text-xs font-semibold">Priority<input name="priority" type="number" min="0" max="999" defaultValue="0" className="rounded-lg border border-black/15 px-3 py-2 font-normal" /></label>
          <button className="w-fit rounded-lg bg-black px-4 py-2 text-sm font-bold text-white self-end">Add revenue rule</button>
        </form>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-2xl font-black">Stores</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(stores ?? []).map((store) => (
            <Link key={store.id} href={`/admin/stores/${store.id}`} className="rounded-xl border border-black/10 p-4">
              <p className="font-black">{store.name}</p>
              <p className="mt-1 text-xs text-black/45">{store.status} · {store.availability_status}{store.ends_at ? ` · ends ${new Date(store.ends_at).toLocaleDateString()}` : " · no end date"}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
