import { DashboardCard } from "@/components/dashboard-card";

export default function AdminPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <DashboardCard label="Organizations" value="0" detail="Connect Supabase to load tenants." />
      <DashboardCard label="Open orders" value="0" detail="Fulfillment queue will appear here." />
      <DashboardCard label="Gross sales" value="$0" detail="Stripe-backed order totals." />
      <DashboardCard label="Org share owed" value="$0" detail="Calculated from immutable ledger entries." />
    </div>
  );
}
