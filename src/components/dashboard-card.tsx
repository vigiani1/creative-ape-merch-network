export function DashboardCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-black/50">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-black/55">{detail}</p>
    </div>
  );
}
