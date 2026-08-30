import { requireOrganizationMembership } from "@/lib/auth";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function PortalReportsPage() {
  const { supabase, organizationIds } = await requireOrganizationMembership();

  const { data: organizations, error: orgError } = await supabase
    .from("organizations")
    .select("id,name")
    .in("id", organizationIds)
    .order("name");

  if (orgError) throw new Error("Unable to load report organizations.");

  const rows = await Promise.all(
    (organizations ?? []).map(async (org) => {
      const { data, error } = await supabase.rpc("organization_sales_summary", { org_id: org.id });
      if (error) throw new Error("Unable to load organization sales summary.");
      const summary = data?.[0] ?? { gross_sales: 0, order_count: 0, organization_share: 0, outstanding_payouts: 0 };
      return { ...org, ...summary };
    })
  );

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <div>
        <p className="text-sm font-semibold text-black/45">Revenue</p>
        <h1 className="mt-1 text-2xl font-black">Reports</h1>
        <p className="mt-2 text-sm text-black/55">Your organization sales and revenue share. Creative Ape internal production costs are not exposed here.</p>\n        <a href="/api/portal/reports/organizations.csv" className="mt-4 inline-block rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white">Download CSV</a>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-black/10 text-black/45">
            <tr>
              <th className="py-3 pr-4 font-semibold">Organization</th>
              <th className="py-3 pr-4 font-semibold">Paid orders</th>
              <th className="py-3 pr-4 font-semibold">Gross sales</th>
              <th className="py-3 pr-4 font-semibold">Revenue share</th>
              <th className="py-3 font-semibold">Outstanding payout</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-black/5 last:border-0">
                <td className="py-4 pr-4 font-bold">{row.name}</td>
                <td className="py-4 pr-4">{Number(row.order_count)}</td>
                <td className="py-4 pr-4">{money(Number(row.gross_sales))}</td>
                <td className="py-4 pr-4 font-bold">{money(Number(row.organization_share))}</td>
                <td className="py-4 font-bold">{money(Number(row.outstanding_payouts))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
