"use client";

import { cn } from "@/lib/utils";
import { useAppStore, useListingsStore } from "@/lib/store";
import type { Listing } from "@/lib/types";
import { formatIDR, formatMATIC, timeAgo } from "@/lib/format";
import { StateBadge } from "./state-badge";
import { ArrowUpRight } from "lucide-react";

interface ListingCardProps {
  listing: Listing;
  compact?: boolean;
}

export function ListingCard({ listing, compact = false }: ListingCardProps) {
  const openListing = useAppStore((s) => s.openListing);

  return (
    <button
      onClick={() => openListing(listing.id)}
      className={cn(
        "group text-left w-full rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/40 hover:bg-card/80 hover:-translate-y-0.5 card-elevated",
        compact ? "p-0" : "p-0",
      )}
    >
      {/* Image area */}
      <div
        className={cn(
          "relative aspect-[4/3] bg-gradient-to-br overflow-hidden bg-muted/20"
        )}
      >
        {listing.imageUrl ? (
          <img src={listing.imageUrl.replace("ipfs://", "https://ipfs.io/ipfs/")} alt="preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 bg-grid opacity-30" />
        )}
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[10px] font-mono uppercase tracking-wider text-white/90 border border-white/10">
            {listing.game}
          </span>
        </div>
        <div className="absolute top-2.5 right-2.5">
          <StateBadge state={listing.status} size="sm" />
        </div>
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
          <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[10px] font-mono uppercase tracking-wider text-white/90 border border-white/10">
            {listing.tier}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5 space-y-3">
        <div className="space-y-1">
          <h3 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          {!compact && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {listing.description}
            </p>
          )}
        </div>

        {/* Features */}
        {!compact && listing.features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.features.slice(0, 3).map((f) => (
              <span
                key={f}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-muted/40 text-muted-foreground border border-border/50"
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-end justify-between pt-2 border-t border-border/60">
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
              Price
            </span>
            <span className="font-mono-num font-semibold text-base text-foreground">
              {formatIDR(listing.priceIDR)}
            </span>
            <span className="font-mono text-[10px] text-primary/80 mt-0.5">
              ≈ {formatMATIC(listing.priceMatic)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
            <span className="text-[10px] font-mono uppercase tracking-wider">
              View
            </span>
            <ArrowUpRight className="size-3.5" />
          </div>
        </div>

        {/* Seller + time */}
        <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground/70 font-mono">
          <span>{listing.sellerName}</span>
          <span>{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </button>
  );
}
