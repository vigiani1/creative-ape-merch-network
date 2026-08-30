import Link from "next/link";
import { notFound } from "next/navigation";
import { updateStore } from "../actions";
import { requireSuperAdmin } from "@/lib/auth";

export default async function StoreEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireSuperAdmin();

  const { data: store, error } = await supabase
    .from("stores")
    .select("id,name,slug,title,description,status,availability_status,starts_at,ends_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !store) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/admin/stores" className="text-sm font-semibold underline">Back to stores</Link><div className="flex gap-2"><Link href={`/admin/stores/${store.id}/builder`} className="rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white">Home builder</Link><Link href={`/admin/stores/${store.id}/pages`} className="rounded-xl border border-black/15 px-4 py-2.5 text-sm font-bold">Page builder</Link></div></div>
      <form action={updateStore} className="mt-5 grid gap-4 rounded-2xl border border-black/10 bg-white p-6">
        <input type="hidden" name="id" value={store.id} />
        <h1 className="text-2xl font-black">Edit store</h1>

        <label className="grid gap-2 text-sm font-semibold">Store name
          <input name="name" defaultValue={store.name} required maxLength={120} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
        </label>

        <label className="grid gap-2 text-sm font-semibold">Public slug
          <input name="slug" defaultValue={store.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
        </label>

        <label className="grid gap-2 text-sm font-semibold">Public title
          <input name="title" defaultValue={store.title ?? ""} maxLength={160} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
        </label>

        <label className="grid gap-2 text-sm font-semibold">Description
          <textarea name="description" defaultValue={store.description ?? ""} rows={5} maxLength={1000} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Publication status
            <select name="status" defaultValue={store.status} className="rounded-xl border border-black/15 px-4 py-3 font-normal">
              <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">Availability
            <select name="availabilityStatus" defaultValue={store.availability_status} className="rounded-xl border border-black/15 px-4 py-3 font-normal">
              <option value="active">Active</option><option value="paused">Paused</option><option value="discontinued">Discontinued</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">Starts at <span className="font-normal text-black/45">Optional</span>
            <input name="startsAt" type="datetime-local" defaultValue={store.starts_at ? new Date(store.starts_at).toISOString().slice(0,16) : ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">Ends at <span className="font-normal text-black/45">Leave blank for no expiration</span>
            <input name="endsAt" type="datetime-local" defaultValue={store.ends_at ? new Date(store.ends_at).toISOString().slice(0,16) : ""} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
          </label>
        </div>

        <p className="rounded-xl bg-neutral-50 p-4 text-sm text-black/55">A published store is public only while Availability is Active and the current time falls inside its optional start/end window. Pausing or discontinuing a store leaves its order/report history intact.</p>

        <button type="submit" className="rounded-xl bg-black px-5 py-3 font-bold text-white">Save changes</button>
      </form>
    </div>
  );
}
