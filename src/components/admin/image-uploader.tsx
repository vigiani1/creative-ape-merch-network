"use client";

import { useRef, useState } from "react";

export function ImageUploader({
  organizationId,
  scope = "organization",
  urlInputName,
  assetIdInputName,
  label = "Upload Image",
  initialUrl = "",
}: {
  organizationId?: string;
  scope?: "master" | "organization";
  urlInputName: string;
  assetIdInputName?: string;
  label?: string;
  initialUrl?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [assetId, setAssetId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setMessage(null);

    const body = new FormData();
    body.set("file", file);
    body.set("scope", scope);
    if (organizationId) body.set("organizationId", organizationId);

    const response = await fetch("/api/admin/media-upload", { method: "POST", body });
    const payload = await response.json() as { url?: string; assetId?: string; error?: string };

    if (!response.ok || !payload.url) {
      setMessage(payload.error || "Upload failed.");
      setBusy(false);
      return;
    }

    setUrl(payload.url);
    setAssetId(payload.assetId || "");
    setMessage("Image uploaded.");
    setBusy(false);
  }

  return (
    <div className="admin-image-uploader">
      <input type="hidden" name={urlInputName} value={url} />
      {assetIdInputName ? <input type="hidden" name={assetIdInputName} value={assetId} /> : null}

      <div className="admin-image-uploader__preview">
        {url ? <img src={url} alt="" /> : <span>No image uploaded</span>}
      </div>

      <div className="admin-image-uploader__actions">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "Uploading…" : label}
        </button>
        {url ? <button type="button" className="admin-image-uploader__remove" onClick={() => { setUrl(""); setAssetId(""); }}>Remove</button> : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.currentTarget.value = "";
        }}
      />

      {message ? <p>{message}</p> : null}
    </div>
  );
}
