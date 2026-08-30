import { AppShell } from "@/components/app-shell";

const nav = [
  ["/portal", "Dashboard"],
  ["/portal/orders", "Orders"],
  ["/portal/reports", "Reports"],
  ["/portal/payouts", "Payouts"],
].map(([href, label]) => ({ href, label }));

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <AppShell title="Organization Portal" eyebrow="Sales & Revenue" nav={nav}>{children}</AppShell>;
}
