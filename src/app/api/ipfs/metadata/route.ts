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

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Metadata tidak valid." }, { status: 400 });
  }

  let contentToPin: any;
  let customPinataName: string;

  if ("metadata" in body && "name" in body) {
    contentToPin = body.metadata;
    customPinataName = String(body.name);
  } else if ("pinataContent" in body) {
    contentToPin = body.pinataContent;
    customPinataName = body.pinataMetadata?.name || "listing-metadata.json";
  } else {
    contentToPin = body;
    const game = (body as any).game
      ? String((body as any).game).toLowerCase().replace(/[^a-z0-9]/g, "-")
      : "item";
    const id = (body as any).id || (body as any).listingId || (body as any).onChainId || "";
    customPinataName = id ? `listing-${id}-${game}.json` : `listing-${game}-${Date.now()}.json`;
  }

  const payload = {
    pinataContent: contentToPin,
    pinataMetadata: {
      name: customPinataName,
    },
  };

  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
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

  const headers = pinataHeaders();

  // 1. Try authenticated Pinata gateway first
  if (headers) {
    try {
      const pinataUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
      const authHeader: Record<string, string> = {};
      if (headers.Authorization) {
        authHeader.Authorization = headers.Authorization;
      } else if (headers.pinata_api_key && headers.pinata_secret_api_key) {
        authHeader.pinata_api_key = headers.pinata_api_key;
        authHeader.pinata_secret_api_key = headers.pinata_secret_api_key;
      }
      
      const res = await fetch(pinataUrl, {
        headers: authHeader,
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {}
  }

  // 2. Fallback to public IPFS gateways
  const gateways = [
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
  ];

  try {
    const data = await Promise.any(
      gateways.map(async (url) => {
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) throw new Error("Gateway failed");
        return await res.json();
      }),
    );
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch metadata from IPFS" }, { status: 504 });
  }
}
