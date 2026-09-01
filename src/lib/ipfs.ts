async function parseUploadResponse(response: Response): Promise<string> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok || typeof data.cid !== "string") {
    throw new Error(data.error || "Upload ke IPFS gagal");
  }

  return data.cid;
}

export async function uploadFileToIPFS(file: File, customName?: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  if (customName) {
    formData.append("name", customName);
  }

  const response = await fetch("/api/ipfs/file", {
    method: "POST",
    body: formData,
  });

  return parseUploadResponse(response);
}

export async function uploadMetadataToIPFS(metadata: unknown, customName?: string): Promise<string> {
  const payload = customName
    ? { metadata, name: customName }
    : metadata;

  const response = await fetch("/api/ipfs/metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseUploadResponse(response);
}
