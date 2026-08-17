import { NextResponse } from "next/server";

export const runtime = "nodejs";

function pinataHeaders(): Record<string, string> | null {
  if (process.env.PINATA_JWT) {
    return {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
      "Content-Type": "application/json",
    };
  }

  const apiKey = process.env.PINATA_API_KEY || process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const apiSecret = process.env.PINATA_API_SECRET || process.env.NEXT_PUBLIC_PINATA_API_SECRET;
  return apiKey && apiSecret
    ? {
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret,
        "Content-Type": "application/json",
      }
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

  const metadata = await request.json().catch(() => null);
  if (!metadata || typeof metadata !== "object") {
    return NextResponse.json({ error: "Metadata tidak valid." }, { status: 400 });
  }

  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers,
    body: JSON.stringify(metadata),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.IpfsHash) {
    return NextResponse.json(
      { error: result.error?.details || result.error || "Pinata gagal mengunggah metadata." },
      { status: response.status || 502 },
    );
  }

  return NextResponse.json({ cid: result.IpfsHash });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cid = searchParams.get("cid");
  if (!cid) {
    return NextResponse.json({ error: "CID required" }, { status: 400 });
  }

  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`,
  ];

  try {
    const data = await Promise.any(
      gateways.map(async (url) => {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error("Gateway failed");
        return await res.json();
      }),
    );
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch metadata from IPFS" }, { status: 504 });
  }
}
