import { requireOrganizationMembership } from "@/lib/auth";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function PortalPayoutsPage() {
  const { supabase, organizationIds } = await requireOrganizationMembership();

  const { data: payouts, error } = await supabase
    .from("payouts")
    .select("id,organization_id,amount,status,period_start,period_end,provider_reference,paid_at,created_at")
    .in("organization_id", organizationIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load payouts.");

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-black/45">Revenue share</p>
          <h1 className="mt-1 text-2xl font-black">Payouts</h1>
        </div>
        <p className="text-sm text-black/50">{payouts?.length ?? 0} total</p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-black/10 text-black/45">
            <tr>
              <th className="py-3 pr-4 font-semibold">Amount</th>
              <th className="py-3 pr-4 font-semibold">Status</th>
              <th className="py-3 pr-4 font-semibold">Period</th>
              <th className="py-3 pr-4 font-semibold">Reference</th>
              <th className="py-3 font-semibold">Paid</th>
            </tr>
          </thead>
          <tbody>
            {(payouts ?? []).map((payout) => (
              <tr key={payout.id} className="border-b border-black/5 last:border-0">
                <td className="py-4 pr-4 font-bold">{money(payout.amount)}</td>
                <td className="py-4 pr-4"><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{payout.status}</span></td>
                <td className="py-4 pr-4 text-xs text-black/55">
                  {payout.period_start ? new Date(payout.period_start).toLocaleDateString("en-US") : "—"} to {payout.period_end ? new Date(payout.period_end).toLocaleDateString("en-US") : "—"}
                </td>
                <td className="py-4 pr-4 text-xs">{payout.provider_reference || "—"}</td>
                <td className="py-4 text-xs text-black/55">{payout.paid_at ? new Date(payout.paid_at).toLocaleDateString("en-US") : "Not paid yet"}</td>
              </tr>
            ))}
            {!payouts?.length ? <tr><td colSpan={5} className="py-12 text-center text-black/45">No payouts recorded yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
