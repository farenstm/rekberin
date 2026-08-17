"use client";

import { useAppStore, useEscrowStore, useListingsStore } from "@/lib/store";
import { CONTRACT_INFO } from "@/lib/contract";
import { StateBadge } from "@/components/state-badge";
import {
  formatMATIC,
  shortenAddress,
  timeAgo,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Box,
  Network,
  Database,
  Cpu,
  FileCode2,
  Shield,
  Receipt,
  Tag,
  Activity,
} from "lucide-react";
import type { EscrowState } from "@/lib/types";

export function ContractStatusView() {
  const transactions = useEscrowStore((s) => s.transactions);
  const listings = useListingsStore((s) => s.listings);
  const setTransactionsTab = useAppStore((s) => s.setTransactionsTab);
  const openTransaction = useAppStore((s) => s.openTransaction);

  // Stats
  const activeEscrows = transactions.filter(
    (t) => t.state === "HELD" || t.state === "REFUND_REQUESTED",
  );
  const releasedCount = transactions.filter((t) => t.state === "RELEASED").length;
  const refundedCount = transactions.filter((t) => t.state === "REFUNDED").length;
  const availableListings = listings.filter((l) => l.status === "AVAILABLE").length;
  const soldListings = listings.filter((l) => l.status === "SOLD").length;

  // Group by 4 actual FSM states
  const stateGroups: Array<{ state: EscrowState; count: number; txs: typeof transactions }> = [
    { state: "HELD", count: 0, txs: [] },
    { state: "REFUND_REQUESTED", count: 0, txs: [] },
    { state: "RELEASED", count: 0, txs: [] },
    { state: "REFUNDED", count: 0, txs: [] },
  ];
  transactions.forEach((t) => {
    const group = stateGroups.find((g) => g.state === t.state);
    if (group) {
      group.count++;
      group.txs.push(t);
    }
  });

  return (
    <div className="animate-fade-slide-up">
      {/* Sub-header */}
      <div className="border-b border-border/60 bg-muted/10">
        <div className="px-4 md:px-6 py-5 max-w-5xl mx-auto">
          <p className="text-xs text-muted-foreground max-w-2xl">
            Status real-time smart contract EscrowChain. Jumlah listing, escrow
            aktif, dan distribusi state transaksi.
          </p>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto space-y-5">
        {/* Contract meta */}
        <div className="rounded-xl border border-border bg-card p-5 card-elevated">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Contract Info
              </span>
            </div>
            <button
              onClick={() => setTransactionsTab("contract-source")}
              className="text-[10px] text-primary hover:underline flex items-center gap-1"
            >
              <FileCode2 className="size-3" />
              View source
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <MetaRow icon={Box} label="Address" value={CONTRACT_INFO.address} mono />
            <MetaRow icon={Network} label="Network" value={CONTRACT_INFO.network} />
            <MetaRow
              icon={Cpu}
              label="Chain ID"
              value={`${parseInt(CONTRACT_INFO.chainId, 16)} (0x${parseInt(CONTRACT_INFO.chainId, 16).toString(16)})`}
            />
            <MetaRow
              icon={Database}
              label="Deploy Block"
              value={`#${CONTRACT_INFO.deployBlock.toLocaleString()}`}
            />
          </div>
        </div>

        {/* Counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CountCard
            icon={Tag}
            label="Total Listings"
            value={listings.length}
            sub={`${availableListings} available`}
            tone="info"
          />
          <CountCard
            icon={Receipt}
            label="Active Escrows"
            value={activeEscrows.length}
            sub="in progress"
            tone="warning"
          />
          <CountCard
            icon={Activity}
            label="Released"
            value={releasedCount}
            sub="completed"
            tone="success"
          />
          <CountCard
            icon={Receipt}
            label="Refunded"
            value={refundedCount}
            sub="cancelled"
            tone="destructive"
          />
        </div>

        {/* State distribution */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-0.5">
                State Distribution
              </div>
              <h3 className="text-base font-semibold">
                Escrow transactions by state
              </h3>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              {transactions.length} total
            </span>
          </div>

          <div className="space-y-2">
            {stateGroups.map((group) => (
              <div key={group.state}>
                <div className="flex items-center justify-between mb-1.5">
                  <StateBadge state={group.state} size="sm" />
                  <span className="font-mono-num text-sm font-semibold">
                    {group.count}
                  </span>
                </div>

                {/* Mini transactions list under each state */}
                {group.txs.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {group.txs.map((tx) => (
                      <button
                        key={tx.id}
                        onClick={() => openTransaction(tx.id)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-muted/20 border border-border/40 hover:bg-muted/40 hover:border-primary/30 transition-all text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs font-semibold text-foreground/80 shrink-0">
                            {tx.id}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate">
                            {tx.listing.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono-num text-xs text-primary">
                            {formatMATIC(tx.amountMatic)}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {timeAgo(tx.updatedAt)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current escrow highlight */}
        {activeEscrows.length > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="size-4 text-warning" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-warning font-semibold">
                Active Escrow Highlight
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Transaksi yang sedang menunggu aksi (buyer konfirmasi, seller
              kirim akun, atau seller approve refund). Buka untuk lihat detail
              state machine.
            </p>
            <div className="space-y-2">
              {activeEscrows.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => openTransaction(tx.id)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md bg-card/60 border border-border/50 hover:bg-card hover:border-primary/30 transition-all text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-sm font-bold">
                      {tx.id}
                    </span>
                    <StateBadge state={tx.state} size="sm" pulse />
                    <span className="text-xs text-muted-foreground truncate hidden md:inline">
                      {tx.listing.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono-num text-sm font-semibold text-primary">
                      {formatMATIC(tx.amountMatic)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Box;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/20 border border-border/50">
      <Icon className="size-3.5 text-muted-foreground shrink-0" />
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground shrink-0">
        {label}
      </span>
      <span
        className={cn(
          "text-xs ml-auto truncate",
          mono ? "font-mono text-foreground/80" : "text-foreground/80",
        )}
      >
        {value.length > 28 ? `${value.slice(0, 14)}...${value.slice(-10)}` : value}
      </span>
    </div>
  );
}

function CountCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Box;
  label: string;
  value: number;
  sub: string;
  tone: "info" | "warning" | "success" | "destructive";
}) {
  const toneClass = {
    info: "text-info border-info/30 bg-info/5",
    warning: "text-warning border-warning/30 bg-warning/5",
    success: "text-success border-success/30 bg-success/5",
    destructive: "text-destructive border-destructive/30 bg-destructive/5",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className={cn("size-9 rounded-lg border flex items-center justify-center mb-3", toneClass)}>
        <Icon className="size-4" />
      </div>
      <div className="font-mono-num text-2xl font-bold">{value}</div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </div>
      <div className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</div>
    </div>
  );
}
