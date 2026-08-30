import { createVendor, updateVendor } from "./actions";
import { requireSuperAdmin } from "@/lib/auth";

export default async function VendorsPage() {
  const { supabase } = await requireSuperAdmin();
  const { data: vendors, error } = await supabase
    .from("vendors")
    .select("id,name,website,contact_name,contact_email,contact_phone,address_line1,address_line2,city,state,postal_code,country,account_reference,notes,active")
    .order("name");

  if (error) throw new Error("Unable to load vendors.");

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-black/45">Supply chain</p>
        <h1 className="mt-1 text-3xl font-black">Vendors</h1>
        <p className="mt-2 max-w-3xl text-sm text-black/55">Enter each supplier once. Active vendors automatically become selectable on product templates and products.</p>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-sm font-semibold text-black/45">New supplier</p>
        <h2 className="mt-1 text-2xl font-black">Vendor onboarding</h2>
        <form action={createVendor} className="mt-5 grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Company name<input name="name" required maxLength={160} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Website<input name="website" maxLength={500} className="rounded-xl border border-black/15 px-4 py-3 font-normal" placeholder="https://..." /></label>
          <label className="grid gap-2 text-sm font-semibold">Contact name<input name="contactName" maxLength={160} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Contact email<input name="contactEmail" type="email" maxLength={320} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Contact phone<input name="contactPhone" maxLength={80} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Account / customer number<input name="accountReference" maxLength={160} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">Address<input name="addressLine1" maxLength={160} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">Address line 2<input name="addressLine2" maxLength={160} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">City<input name="city" maxLength={120} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">State<input name="state" maxLength={120} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">ZIP / Postal<input name="postalCode" maxLength={20} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Country<input name="country" defaultValue="US" maxLength={2} className="rounded-xl border border-black/15 px-4 py-3 font-normal uppercase" /></label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">Notes<textarea name="notes" rows={3} maxLength={3000} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
          <label className="flex items-center gap-3 text-sm font-semibold"><input name="active" type="checkbox" defaultChecked className="h-4 w-4" /> Active vendor</label>
          <button type="submit" className="w-fit rounded-xl bg-black px-5 py-3 font-bold text-white">Add vendor</button>
        </form>
      </section>

      {(vendors ?? []).map((vendor) => (
        <section key={vendor.id} className="rounded-2xl border border-black/10 bg-white p-6">
          <form action={updateVendor} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="id" value={vendor.id} />
            <label className="grid gap-2 text-sm font-semibold">Company name<input name="name" defaultValue={vendor.name} required className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-semibold">Website<input name="website" defaultValue={vendor.website ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-semibold">Contact name<input name="contactName" defaultValue={vendor.contact_name ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-semibold">Contact email<input name="contactEmail" type="email" defaultValue={vendor.contact_email ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-semibold">Contact phone<input name="contactPhone" defaultValue={vendor.contact_phone ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-semibold">Account / customer number<input name="accountReference" defaultValue={vendor.account_reference ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-semibold md:col-span-2">Address<input name="addressLine1" defaultValue={vendor.address_line1 ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-semibold md:col-span-2">Address line 2<input name="addressLine2" defaultValue={vendor.address_line2 ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-semibold">City<input name="city" defaultValue={vendor.city ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-semibold">State<input name="state" defaultValue={vendor.state ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-semibold">ZIP / Postal<input name="postalCode" defaultValue={vendor.postal_code ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-semibold">Country<input name="country" defaultValue={vendor.country} maxLength={2} className="rounded-xl border border-black/15 px-4 py-3 font-normal uppercase" /></label>
            <label className="grid gap-2 text-sm font-semibold md:col-span-2">Notes<textarea name="notes" rows={3} defaultValue={vendor.notes ?? ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" /></label>
            <label className="flex items-center gap-3 text-sm font-semibold"><input name="active" type="checkbox" defaultChecked={vendor.active} className="h-4 w-4" /> Active vendor</label>
            <button type="submit" className="w-fit rounded-xl border border-black/15 px-4 py-2.5 text-sm font-bold">Save vendor</button>
          </form>
        </section>
      ))}
    </div>
  );
}
