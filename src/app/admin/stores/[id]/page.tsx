import Link from "next/link";
import { notFound } from "next/navigation";
import { updateStore } from "../actions";
import { requireSuperAdmin } from "@/lib/auth";

export default async function StoreEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireSuperAdmin();

  const { data: store, error } = await supabase
    .from("stores")
    .select("id,name,slug,title,description,status")
    .eq("id", id)
    .maybeSingle();

  if (error || !store) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/stores" className="text-sm font-semibold underline">Back to stores</Link>
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

        <label className="grid gap-2 text-sm font-semibold">Status
          <select name="status" defaultValue={store.status} className="rounded-xl border border-black/15 px-4 py-3 font-normal">
            <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
          </select>
        </label>

        <button type="submit" className="rounded-xl bg-black px-5 py-3 font-bold text-white">Save changes</button>
      </form>
    </div>
  );
}
