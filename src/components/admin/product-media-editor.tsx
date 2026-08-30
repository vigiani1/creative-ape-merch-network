"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ExistingMedia = {
  id: string;
  media_type: string;
  storage_path: string | null;
  external_url: string | null;
  alt_text: string | null;
  is_primary: boolean;
};

export function ProductMediaEditor({
  productId,
  organizationId,
  productName,
  media,
}: {
  productId: string;
  organizationId: string;
  productName: string;
  media: ExistingMedia[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function safeName(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function publicUrl(item: ExistingMedia) {
    if (item.external_url) return item.external_url;
    if (!item.storage_path) return null;
    return supabase.storage.from("product-media").getPublicUrl(item.storage_path).data.publicUrl;
  }

  async function upload(file: File) {
    setBusy(true);
    setMessage(null);

    const mediaType = file.type.startsWith("video/") ? "video" : "image";
    const path = `${organizationId}/${productId}/${crypto.randomUUID()}-${safeName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from("product-media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) {
      setBusy(false);
      setMessage(uploadError.message);
      return;
    }

    const shouldBePrimary = !media.some((item) => item.is_primary) && mediaType === "image";
    const { error: insertError } = await supabase.from("product_media").insert({
      organization_id: organizationId,
      product_id: productId,
      media_type: mediaType,
      storage_path: path,
      external_url: null,
      alt_text: productName,
      display_order: media.length,
      is_primary: shouldBePrimary,
    });

    if (insertError) {
      await supabase.storage.from("product-media").remove([path]);
      setBusy(false);
      setMessage(insertError.message);
      return;
    }

    setBusy(false);
    setMessage("Media uploaded.");
    router.refresh();
  }

  async function makePrimary(id: string) {
    setBusy(true);
    setMessage(null);
    const { error: resetError } = await supabase.from("product_media").update({ is_primary: false }).eq("product_id", productId);
    if (resetError) {
      setBusy(false);
      setMessage(resetError.message);
      return;
    }
    const { error } = await supabase.from("product_media").update({ is_primary: true }).eq("id", id);
    setBusy(false);
    setMessage(error ? error.message : "Primary image updated.");
    if (!error) router.refresh();
  }

  async function remove(item: ExistingMedia) {
    setBusy(true);
    setMessage(null);
    const { error: rowError } = await supabase.from("product_media").delete().eq("id", item.id);
    if (rowError) {
      setBusy(false);
      setMessage(rowError.message);
      return;
    }
    if (item.storage_path) await supabase.storage.from("product-media").remove([item.storage_path]);
    setBusy(false);
    setMessage("Media removed.");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-black/45">Product media</p>
          <h2 className="mt-1 text-xl font-black">{productName}</h2>
        </div>
        <label className="cursor-pointer rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white">
          {busy ? "Working..." : "Upload photo/video"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
            disabled={busy}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </label>
      </div>

      {message ? <p className="mt-3 text-sm text-black/55">{message}</p> : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {media.map((item) => {
          const url = publicUrl(item);
          return (
            <div key={item.id} className="overflow-hidden rounded-xl border border-black/10">
              <div className="aspect-square bg-neutral-100">
                {url && item.media_type === "video" ? (
                  <video src={url} controls className="h-full w-full object-cover" />
                ) : url ? (
                  <img src={url} alt={item.alt_text ?? ""} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="grid gap-2 p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{item.media_type}</span>
                  {item.is_primary ? <span className="rounded-full bg-neutral-100 px-2 py-1 font-bold">Primary</span> : null}
                </div>
                <div className="flex gap-2">
                  {item.media_type === "image" && !item.is_primary ? (
                    <button type="button" disabled={busy} onClick={() => void makePrimary(item.id)} className="font-semibold underline">Make primary</button>
                  ) : null}
                  <button type="button" disabled={busy} onClick={() => void remove(item)} className="font-semibold underline">Remove</button>
                </div>
              </div>
            </div>
          );
        })}
        {!media.length ? <p className="text-sm text-black/45">No media yet.</p> : null}
      </div>
    </div>
  );
}
