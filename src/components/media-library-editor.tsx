"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  publicUrl: string;
};

export function MediaLibraryEditor({
  organizations,
  assets,
  allowMaster,
}: {
  organizations: Org[];
  assets: Asset[];
  allowMaster: boolean;
}) {
  const router = useRouter();
  const [scope, setScope] = useState<"master" | "organization">(allowMaster ? "master" : "organization");
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((asset) => {
      const inScope = scope === "master" ? asset.scope === "master" : asset.organization_id === organizationId;
      if (!inScope) return false;
      if (!q) return true;
      return [asset.title, asset.file_name, asset.alt_text, ...(asset.tags ?? [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [assets, organizationId, query, scope]);

  async function upload(file: File) {
    setBusy(true);
    setMessage(null);

    const body = new FormData();
    body.set("file", file);
    body.set("scope", scope);
    if (organizationId) body.set("organizationId", organizationId);

    const response = await fetch("/api/admin/media-upload", { method: "POST", body });
    const payload = await response.json() as { error?: string };

    setBusy(false);
    setMessage(response.ok ? "Added to Media Library." : payload.error || "Upload failed.");
    if (response.ok) router.refresh();
  }

  async function remove(asset: Asset) {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/media-delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: asset.id, storagePath: asset.storage_path }),
    });
    const payload = await response.json() as { error?: string };

    setBusy(false);
    setMessage(response.ok ? "Media removed." : payload.error || "Unable to remove media.");
    if (response.ok) router.refresh();
  }

  return (
    <div className="admin-media-library">
      <section className="admin-media-toolbar">
        {allowMaster ? (
          <label className="admin-field">
            <span>Library</span>
            <select value={scope} onChange={(event) => setScope(event.target.value as "master" | "organization")}>
              <option value="master">Creative Ape master</option>
              <option value="organization">Organization</option>
            </select>
          </label>
        ) : null}

        <label className="admin-field">
          <span>Organization</span>
          <select disabled={scope === "master"} value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.number ? `CA-${String(org.number).padStart(6,"0")} · ` : ""}{org.name}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field admin-field--wide">
          <span>Search media</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, alt text, tag..." />
        </label>

        <label className="admin-upload-button">
          {busy ? "Working…" : "Upload Media"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </section>

      {message ? <p className="admin-media-message">{message}</p> : null}

      <section className="admin-media-grid">
        {filtered.map((asset) => (
          <article key={asset.id} className="admin-media-card">
            <div className="admin-media-card__preview">
              {asset.media_type === "video" ? (
                <video src={asset.publicUrl} controls />
              ) : asset.media_type === "image" ? (
                <img src={asset.publicUrl} alt={asset.alt_text ?? ""} />
              ) : (
                <div className="admin-media-card__file">{asset.file_name}</div>
              )}
              <span>{asset.media_type}</span>
            </div>
            <div className="admin-media-card__body">
              <div>
                <h3>{asset.title || asset.file_name}</h3>
                <p>{asset.file_name}</p>
              </div>
              <div className="admin-media-card__actions">
                <button type="button" onClick={() => navigator.clipboard.writeText(asset.publicUrl)}>Copy URL</button>
                <button type="button" disabled={busy} onClick={() => void remove(asset)}>Remove</button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {!filtered.length ? (
        <div className="admin-empty admin-empty--large">
          <h3>No media found.</h3>
          <p>Upload an asset or adjust the library filter.</p>
        </div>
      ) : null}
    </div>
  );
}
