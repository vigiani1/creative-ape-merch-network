import { DashboardCard } from "@/components/dashboard-card";

export default function PortalPage() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <DashboardCard label="Sales" value="$0" detail="Your organization's eligible sales." />
      <DashboardCard label="Revenue share" value="$0" detail="Earned share without Creative Ape internal cost data." />
      <DashboardCard label="Outstanding payout" value="$0" detail="Pending payout balance." />
    </div>
  );
}
