import { notFound } from "next/navigation";

const sections = new Set(["organizations", "stores", "members", "products", "library", "templates", "vendors", "branding", "media", "orders", "fulfillment", "reports", "settings"]);

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.has(section)) notFound();
  const title = section.charAt(0).toUpperCase() + section.slice(1);
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-black/55">This management area is staged for its next live-data implementation.</p>
    </div>
  );
}
