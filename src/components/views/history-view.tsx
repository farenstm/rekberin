"use client";

import { useState, useMemo } from "react";
import { useAppStore, useEscrowStore } from "@/lib/store";
import { StateBadge } from "@/components/state-badge";
import {
  formatIDR,
  formatMATIC,
  shortenAddress,
  shortenHash,
  timeAgo,
  formatDate,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  ArrowRight,
  History as HistoryIcon,
  Filter,
} from "lucide-react";
import type { EscrowState } from "@/lib/types";

const STATE_FILTERS: Array<{ value: EscrowState | "ALL"; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "HELD", label: "Held" },
  { value: "DEPOSITED", label: "Deposited" },
  { value: "RELEASED", label: "Released" },
  { value: "REFUNDED", label: "Refunded" },
];

export function HistoryView() {
  const transactions = useEscrowStore((s) => s.transactions);
  const openTransaction = useAppStore((s) => s.openTransaction);
  const [filter, setFilter] = useState<EscrowState | "ALL">("ALL");

  const filtered = useMemo(() => {
    let list = [...transactions].sort((a, b) => b.createdAt - a.createdAt);
    if (filter !== "ALL") list = list.filter((t) => t.state === filter);
    return list;
  }, [transactions, filter]);

  const stats = useMemo(() => {
    const total = transactions.length;
    const released = transactions.filter((t) => t.state === "RELEASED").length;
    const refunded = transactions.filter((t) => t.state === "REFUNDED").length;
    const held = transactions.filter(
      (t) => t.state === "HELD" || t.state === "DEPOSITED",
    ).length;
    return { total, released, refunded, held };
  }, [transactions]);

  return (
    <div className="animate-fade-slide-up">
      {/* Sub-header */}
      <div className="border-b border-border/60 bg-muted/10">
        <div className="px-4 md:px-6 py-5 max-w-5xl mx-auto">
          <p className="text-xs text-muted-foreground max-w-2xl">
            Semua transaksi escrow yang pernah Anda ikuti. Setiap entry adalah
            event log on-chain.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <StatCard label="Total" value={stats.total} tone="muted" />
            <StatCard label="In Escrow" value={stats.held} tone="warning" />
            <StatCard label="Released" value={stats.released} tone="success" />
            <StatCard label="Refunded" value={stats.refunded} tone="destructive" />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1">
            <Filter className="size-3.5 text-muted-foreground shrink-0" />
            {STATE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-all shrink-0",
                  filter === f.value
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              Belum ada riwayat transaksi dengan filter ini.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx) => (
              <button
                key={tx.id}
                onClick={() => openTransaction(tx.id)}
                className={cn(
                  "group w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:bg-card/80 transition-all card-elevated",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: ID + listing */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="relative size-11 rounded-lg border border-border shrink-0">
                      {tx.listing.imageUrl ? (
                        <img 
                          src={tx.listing.imageUrl.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")} 
                          alt="Thumb" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-2xl pt-2 pl-2 block">🎮</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold">
                          {tx.id}
                        </span>
                        <StateBadge state={tx.state} size="sm" />
                      </div>
                      <div className="text-sm text-foreground/90 line-clamp-1">
                        {tx.listing.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-muted-foreground">
                        <span>{tx.listing.game}</span>
                        <span>•</span>
                        <span>{formatDate(tx.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: amount + arrow */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="font-mono-num text-sm font-semibold">
                      {formatMATIC(tx.amountMatic)}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {formatIDR(tx.amountIDR)}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground group-hover:text-primary transition-colors mt-1">
                      Open
                      <ArrowRight className="size-2.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Timeline compact */}
                <div className="mt-3 pt-3 border-t border-border/60">
                  <CompactTimeline state={tx.state} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "muted" | "warning" | "success" | "destructive";
}) {
  const toneClass = {
    muted: "text-muted-foreground",
    warning: "text-warning",
    success: "text-success",
    destructive: "text-destructive",
  }[tone];

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn("font-mono-num text-xl font-bold mt-1", toneClass)}>
        {value}
      </div>
    </div>
  );
}

function CompactTimeline({ state }: { state: EscrowState }) {
  const steps = [
    { label: "Deposit", done: state !== "NONE", active: state === "DEPOSITED" },
    { label: "Hold", done: ["HELD", "RELEASED", "REFUNDED"].includes(state), active: state === "HELD" },
    {
      label: state === "REFUNDED" ? "Refund" : "Release",
      done: state === "RELEASED" || state === "REFUNDED",
      active: false,
    },
  ];

  const isRefunded = state === "REFUNDED";

  return (
    <div className="flex items-center gap-1.5">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-1.5">
          {i > 0 && (
            <div
              className={cn(
                "h-px w-4",
                s.done ? (isRefunded && s.label === "Refund" ? "bg-destructive" : "bg-success") : "bg-border",
              )}
            />
          )}
          <div
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider",
              s.done && !isRefunded && "text-success",
              s.done && isRefunded && s.label === "Refund" && "text-destructive",
              s.done && isRefunded && s.label !== "Refund" && "text-success",
              s.active && "text-warning",
              !s.done && !s.active && "text-muted-foreground/50",
            )}
          >
            {s.done ? (
              isRefunded && s.label === "Refund" ? (
                <XCircle className="size-2.5" />
              ) : (
                <CheckCircle2 className="size-2.5" />
              )
            ) : s.active ? (
              <Clock className="size-2.5" />
            ) : (
              <Shield className="size-2.5" />
            )}
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
