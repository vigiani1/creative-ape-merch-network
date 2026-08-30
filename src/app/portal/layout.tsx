import { AppShell } from "@/components/app-shell";
import { requireOrganizationMembership } from "@/lib/auth";

export const dynamic = "force-dynamic";

const nav = [
  ["/portal", "Dashboard"],
  ["/portal/stores", "Storefronts"],
  ["/portal/library", "Product Library"],
  ["/portal/orders", "Orders"],
  ["/portal/reports", "Reports"],
  ["/portal/payouts", "Payouts"],
].map(([href, label]) => ({ href, label }));

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await requireOrganizationMembership();
  return <AppShell title="Organization Portal" eyebrow="Sales & Revenue" nav={nav}>{children}</AppShell>;
}
