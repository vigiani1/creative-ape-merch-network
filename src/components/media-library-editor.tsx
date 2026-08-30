"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Org = { id: string; name: string; number?: number };
type Asset = {
  id: string;
  organization_id: string | null;
  scope: string;
  media_type: string;
  title: string | null;
  file_name: string;
  mime_type: string | null;
  storage_path: string;
  alt_text: string | null;
  tags: string[];
};

function safeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function MediaLibraryEditor({
  organizations,
  assets,
  allowMaster,
}: {
  organizations: Org[];
  assets: Asset[];
  allowMaster: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [scope, setScope] = useState<"master" | "organization">(allowMaster ? "master" : "organization");
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((asset) => {
      const inScope = scope === "master"
        ? asset.scope === "master"
        : asset.organization_id === organizationId;
      if (!inScope) return false;
      if (!q) return true;
      return [asset.title, asset.file_name, asset.alt_text, ...(asset.tags ?? [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [assets, organizationId, query, scope]);

  function publicUrl(path: string) {
    return supabase.storage.from("media-library").getPublicUrl(path).data.publicUrl;
  }

  async function upload(file: File) {
    if (scope === "organization" && !organizationId) {
      setMessage("Choose an organization first.");
      return;
    }

    setBusy(true);
    setMessage(null);

    const folder = scope === "master" ? "master" : organizationId;
    const path = `${folder}/${crypto.randomUUID()}-${safeName(file.name)}`;
    const mediaType = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : "file";

    const { error: uploadError } = await supabase.storage.from("media-library").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) {
      setBusy(false);
      setMessage(uploadError.message);
      return;
    }

    const { error: rowError } = await supabase.from("media_assets").insert({
      organization_id: scope === "organization" ? organizationId : null,
      scope,
      media_type: mediaType,
      title: file.name.replace(/\.[^.]+$/, ""),
      file_name: file.name,
      mime_type: file.type || null,
      storage_path: path,
      alt_text: file.name.replace(/\.[^.]+$/, ""),
      tags: [],
      is_public: true,
    });

    if (rowError) {
      await supabase.storage.from("media-library").remove([path]);
      setBusy(false);
      setMessage(rowError.message);
      return;
    }

    setBusy(false);
    setMessage("Added to Media Library.");
    router.refresh();
  }

  async function remove(asset: Asset) {
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.from("media_assets").delete().eq("id", asset.id);
    if (!error) await supabase.storage.from("media-library").remove([asset.storage_path]);
    setBusy(false);
    setMessage(error ? error.message : "Media removed.");
    if (!error) router.refresh();
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 rounded-2xl border border-black/10 bg-white p-5 md:grid-cols-[1fr_1fr_1.5fr_auto]">
        {allowMaster ? (
          <label className="grid gap-2 text-sm font-semibold">Library
            <select value={scope} onChange={(event) => setScope(event.target.value as "master" | "organization")} className="rounded-xl border border-black/15 px-4 py-3 font-normal">
              <option value="master">Creative Ape master</option>
              <option value="organization">Organization</option>
            </select>
          </label>
        ) : <div />}

        <label className="grid gap-2 text-sm font-semibold">Organization
          <select disabled={scope === "master"} value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} className="rounded-xl border border-black/15 px-4 py-3 font-normal disabled:bg-neutral-100">
            {organizations.map((org) => <option key={org.id} value={org.id}>{org.number ? `CA-${String(org.number).padStart(6,"0")} · ` : ""}{org.name}</option>)}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold">Search media
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, alt text, tag..." className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
        </label>

        <label className="self-end cursor-pointer rounded-xl bg-black px-5 py-3 text-center text-sm font-bold text-white">
          {busy ? "Working..." : "Upload media"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,application/pdf"
            disabled={busy}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </label>
      </div>

      {message ? <p className="text-sm text-black/55">{message}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((asset) => {
          const url = publicUrl(asset.storage_path);
          return (
            <article key={asset.id} className="overflow-hidden rounded-2xl border border-black/10 bg-white">
              <div className="aspect-square bg-neutral-100">
                {asset.media_type === "video" ? <video src={url} controls className="h-full w-full object-cover" /> :
                  asset.media_type === "image" ? <img src={url} alt={asset.alt_text ?? ""} className="h-full w-full object-cover" /> :
                  <div className="flex h-full items-center justify-center p-4 text-center text-sm font-bold">File<br />{asset.file_name}</div>}
              </div>
              <div className="grid gap-2 p-4 text-sm">
                <p className="font-black">{asset.title || asset.file_name}</p>
                <p className="break-all text-xs text-black/40">{asset.storage_path}</p>
                <div className="flex gap-3 text-xs font-semibold">
                  <button type="button" onClick={() => navigator.clipboard.writeText(url)} className="underline">Copy URL</button>
                  <button type="button" disabled={busy} onClick={() => void remove(asset)} className="underline">Remove</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!filtered.length ? <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center text-sm text-black/45">No media matches this library/filter yet.</div> : null}
    </div>
  );
}
