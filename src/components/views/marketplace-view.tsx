"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X, PlusSquare } from "lucide-react";
import { useAppStore, useListingsStore } from "@/lib/store";
import { ListingCard } from "@/components/listing-card";
import { cn } from "@/lib/utils";

const GAMES = [
  "All",
  "Mobile Legends",
  "Valorant",
  "Genshin Impact",
  "Free Fire",
  "PUBG Mobile",
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low → High" },
  { value: "price-high", label: "Price: High → Low" },
];

export function MarketplaceView() {
  const listings = useListingsStore((s) => s.listings);
  const setView = useAppStore((s) => s.setView);
  const [query, setQuery] = useState("");
  const [game, setGame] = useState("All");
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => {
    let list = [...listings].filter((l) => l.status === "AVAILABLE");
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.game.toLowerCase().includes(q) ||
          l.tier.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q),
      );
    }
    if (game !== "All") list = list.filter((l) => l.game === game);
    list.sort((a, b) => {
      if (sort === "price-low") return a.priceIDR - b.priceIDR;
      if (sort === "price-high") return b.priceIDR - a.priceIDR;
      return b.createdAt - a.createdAt;
    });
    return list;
  }, [listings, query, game, sort]);

  return (
    <div className="animate-fade-slide-up">
      {/* Header */}
      <div className="border-b border-border/60 bg-muted/10">
        <div className="px-4 md:px-6 py-8 max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Marketplace
              </span>
              <h1 className="text-2xl md:text-3xl font-bold mt-1 mb-2">
                Jelajahi akun game impianmu
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Temukan akun game terbaik dengan transaksi aman dan terpercaya melalui sistem Smart Contract.
              </p>
            </div>
            <button
              onClick={() => setView("create-listing")}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/30 text-sm font-medium transition-all shrink-0"
            >
              <PlusSquare className="size-4 text-primary" />
              Jual Akun
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari akun, game, atau tier..."
              className="w-full h-11 pl-10 pr-10 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {GAMES.map((g) => (
                <button
                  key={g}
                  onClick={() => setGame(g)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                    game === g
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-8 px-2.5 rounded-md border border-border bg-card text-xs font-medium focus:outline-none focus:border-primary/40"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Listings grid */}
      <div className="px-4 md:px-6 py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted-foreground font-mono">
            {filtered.length} listing{filtered.length !== 1 ? "s" : ""} found
          </span>
          <button
            onClick={() => setView("create-listing")}
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/30 text-xs font-medium"
          >
            <PlusSquare className="size-3.5 text-primary" />
            Create
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground mt-2">
              Belum ada produk yang cocok dengan pencarianmu
            </p>
            <button
              onClick={() => {
                setQuery("");
                setGame("All");
              }}
              className="text-xs text-primary hover:underline"
            >
              Reset filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
