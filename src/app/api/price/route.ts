import { NextResponse } from "next/server";

// In-memory cache for 60 seconds
let cachedPrice: number = 1660;
let lastFetchTime: number = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export async function GET() {
  const now = Date.now();

  // Return cached price if still fresh
  if (now - lastFetchTime < CACHE_TTL_MS && cachedPrice > 0) {
    return NextResponse.json({
      polIdr: cachedPrice,
      updatedAt: lastFetchTime,
      source: "cache",
    });
  }

  // 1. Try Indodax ticker (Fastest in Indonesia)
  try {
    const res = await fetch("https://indodax.com/api/ticker/polidr", {
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      const lastPrice = parseFloat(data?.ticker?.last);
      if (lastPrice && lastPrice > 500 && lastPrice < 50000) {
        cachedPrice = lastPrice;
        lastFetchTime = now;
        return NextResponse.json({
          polIdr: cachedPrice,
          updatedAt: lastFetchTime,
          source: "indodax",
        });
      }
    }
  } catch (e) {
    // try fallback
  }

  // 2. Try CoinGecko API
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=polygon-ecosystem-token&vs_currencies=idr",
      {
        signal: AbortSignal.timeout(3000),
        next: { revalidate: 60 },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const cgPrice = data?.["polygon-ecosystem-token"]?.idr;
      if (cgPrice && cgPrice > 500 && cgPrice < 50000) {
        cachedPrice = Math.round(cgPrice);
        lastFetchTime = now;
        return NextResponse.json({
          polIdr: cachedPrice,
          updatedAt: lastFetchTime,
          source: "coingecko",
        });
      }
    }
  } catch (e) {
    // try fallback
  }

  // 3. Fallback to last known price or 1660
  return NextResponse.json({
    polIdr: cachedPrice || 1660,
    updatedAt: lastFetchTime || now,
    source: "fallback",
  });
}
