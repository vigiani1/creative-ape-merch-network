"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Theme = {
  logo_url: string | null;
  hero_image_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
};

export function StoreBrandingEditor({
  storeId,
  organizationId,
  storeName,
  theme,
}: {
  storeId: string;
  organizationId: string;
  storeName: string;
  theme: Theme;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [colors, setColors] = useState({
    primary_color: theme.primary_color,
    secondary_color: theme.secondary_color,
    accent_color: theme.accent_color,
    background_color: theme.background_color,
    text_color: theme.text_color,
  });

  function safeName(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  }

  async function uploadAsset(file: File, type: "logo" | "hero") {
    setBusy(type);
    setMessage(null);

    const path = `${organizationId}/${storeId}/${type}/${crypto.randomUUID()}-${safeName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from("brand-assets").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) {
      setBusy(null);
      setMessage(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("brand-assets").getPublicUrl(path);
    const publicUrl = publicUrlData.publicUrl;

    const { error: assetError } = await supabase.from("brand_assets").insert({
      organization_id: organizationId,
      store_id: storeId,
      asset_type: type,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type || null,
      is_public: true,
    });

    if (assetError) {
      await supabase.storage.from("brand-assets").remove([path]);
      setBusy(null);
      setMessage(assetError.message);
      return;
    }

    const update = type === "logo" ? { logo_url: publicUrl } : { hero_image_url: publicUrl };
    const { error: themeError } = await supabase.from("store_themes").update(update).eq("store_id", storeId);

    if (themeError) {
      setBusy(null);
      setMessage(themeError.message);
      return;
    }

    setBusy(null);
    setMessage(`${type === "logo" ? "Logo" : "Hero image"} updated.`);
    router.refresh();
  }

  async function saveColors() {
    setBusy("colors");
    setMessage(null);
    const { error } = await supabase.from("store_themes").update(colors).eq("store_id", storeId);
    setBusy(null);
    setMessage(error ? error.message : "Store colors updated.");
    if (!error) router.refresh();
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-black/45">Store branding</p>
          <h2 className="mt-1 text-xl font-black">{storeName}</h2>
        </div>
        {theme.logo_url ? <img src={theme.logo_url} alt="" className="h-14 w-14 rounded-xl object-contain ring-1 ring-black/10" /> : null}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Logo
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            disabled={busy !== null}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadAsset(file, "logo");
            }}
            className="rounded-xl border border-black/15 px-3 py-3 font-normal"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          Hero image
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={busy !== null}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadAsset(file, "hero");
            }}
            className="rounded-xl border border-black/15 px-3 py-3 font-normal"
          />
        </label>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {([
          ["primary_color", "Primary"],
          ["secondary_color", "Secondary"],
          ["accent_color", "Accent"],
          ["background_color", "Background"],
          ["text_color", "Text"],
        ] as const).map(([key, label]) => (
          <label key={key} className="grid gap-2 text-sm font-semibold">
            {label}
            <div className="flex items-center gap-2 rounded-xl border border-black/15 p-2">
              <input
                type="color"
                value={colors[key]}
                onChange={(event) => setColors((current) => ({ ...current, [key]: event.target.value }))}
                className="h-9 w-12 cursor-pointer border-0 bg-transparent"
              />
              <span className="font-mono text-xs">{colors[key]}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-4">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void saveColors()}
          className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy === "colors" ? "Saving..." : "Save colors"}
        </button>
        {message ? <p className="text-sm text-black/55">{message}</p> : null}
      </div>

      {theme.hero_image_url ? <img src={theme.hero_image_url} alt="" className="mt-6 h-44 w-full rounded-2xl object-cover" /> : null}
    </div>
  );
}
