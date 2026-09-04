"use client";

import { useState, useEffect } from "react";

export const DEFAULT_POL_PRICE_IDR = 1660;

let globalPolPrice = DEFAULT_POL_PRICE_IDR;
let globalLastFetched = 0;

export async function fetchLivePolPrice(): Promise<number> {
  const now = Date.now();
  if (now - globalLastFetched < 30 * 1000 && globalPolPrice > 0) {
    return globalPolPrice;
  }

  try {
    const res = await fetch("/api/price", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data?.polIdr && typeof data.polIdr === "number") {
        globalPolPrice = data.polIdr;
        globalLastFetched = now;
        return data.polIdr;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch live POL price, using fallback:", e);
  }

  return globalPolPrice;
}

export function usePolPrice() {
  const [polPrice, setPolPrice] = useState<number>(globalPolPrice);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const price = await fetchLivePolPrice();
        if (isMounted) {
          setPolPrice(price);
          setLoading(false);
        }
      } catch (e) {
        if (isMounted) setLoading(false);
      }
    }

    load();

    // Poll every 60 seconds
    const interval = setInterval(load, 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { polPrice, loading };
}
