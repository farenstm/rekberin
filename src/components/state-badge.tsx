"use client";

import { cn } from "@/lib/utils";
import type { ListingStatus, EscrowState } from "@/lib/types";

interface StateBadgeProps {
  state: EscrowState | ListingStatus;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

const ESCROW_STATE_CONFIG: Record<
  EscrowState,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  NONE: {
    label: "NONE",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
    bg: "bg-muted/30",
    border: "border-border",
  },
  DEPOSITED: {
    label: "DEPOSITED",
    dot: "bg-info",
    text: "text-info",
    bg: "bg-info/10",
    border: "border-info/30",
  },
  HELD: {
    label: "HELD",
    dot: "bg-warning",
    text: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
  },
  REFUND_REQUESTED: {
    label: "REFUND REQUESTED",
    dot: "bg-orange-400",
    text: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/30",
  },
  RELEASED: {
    label: "RELEASED",
    dot: "bg-success",
    text: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
  },
  REFUNDED: {
    label: "REFUNDED",
    dot: "bg-destructive",
    text: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
  },
  DISPUTED: {
    label: "DISPUTED",
    dot: "bg-warning",
    text: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
  },
};

const LISTING_STATUS_CONFIG: Record<
  ListingStatus,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  AVAILABLE: {
    label: "AVAILABLE",
    dot: "bg-success",
    text: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
  },
  LOCKED: {
    label: "LOCKED",
    dot: "bg-warning",
    text: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
  },
  SOLD: {
    label: "SOLD",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
    bg: "bg-muted/30",
    border: "border-border",
  },
  CANCELLED: {
    label: "CANCELLED",
    dot: "bg-destructive",
    text: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
  },
};

export function StateBadge({
  state,
  size = "md",
  pulse = false,
  className,
}: StateBadgeProps) {
  const cfg =
    (state && state in ESCROW_STATE_CONFIG
      ? ESCROW_STATE_CONFIG[state as EscrowState]
      : state && state in LISTING_STATUS_CONFIG
        ? LISTING_STATUS_CONFIG[state as ListingStatus]
        : null) || ESCROW_STATE_CONFIG.NONE;

  const sizes = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  };

  const dotSizes = {
    sm: "size-1.5",
    md: "size-2",
    lg: "size-2.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-mono uppercase tracking-wider font-semibold",
        cfg.bg,
        cfg.text,
        cfg.border,
        sizes[size],
        className,
      )}
    >
      <span
        className={cn(
          "rounded-full",
          cfg.dot,
          dotSizes[size],
          pulse && "animate-pulse-soft",
        )}
      />
      {cfg.label}
    </span>
  );
}
