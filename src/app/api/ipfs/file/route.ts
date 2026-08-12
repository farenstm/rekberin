import { NextResponse } from "next/server";

export const runtime = "nodejs";

function pinataHeaders(): Record<string, string> | null {
  if (process.env.PINATA_JWT) {
    return { Authorization: `Bearer ${process.env.PINATA_JWT}` };
  }

  const apiKey = process.env.PINATA_API_KEY || process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const apiSecret = process.env.PINATA_API_SECRET || process.env.NEXT_PUBLIC_PINATA_API_SECRET;
  return apiKey && apiSecret
    ? { pinata_api_key: apiKey, pinata_secret_api_key: apiSecret }
    : null;
}

export async function POST(request: Request) {
  const headers = pinataHeaders();
  if (!headers) {
    return NextResponse.json(
      { error: "Kredensial Pinata belum dikonfigurasi di Vercel." },
      { status: 503 },
    );
  }

  const input = await request.formData();
  const file = input.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File gambar tidak valid." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Ukuran gambar maksimal 10 MB." }, { status: 413 });
  }

  const body = new FormData();
  body.append("file", file, file.name);

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers,
    body,
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.IpfsHash) {
    return NextResponse.json(
      { error: result.error?.details || result.error || "Pinata gagal mengunggah gambar." },
      { status: response.status || 502 },
    );
  }

  return NextResponse.json({ cid: result.IpfsHash });
}
