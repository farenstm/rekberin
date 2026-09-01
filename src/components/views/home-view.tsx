"use client";

import { useMemo } from "react";
import {
  Shield,
  Lock,
  Send,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  XCircle,
  Clock,
} from "lucide-react";
import { useAppStore, useListingsStore, useEscrowStore, useWalletStore } from "@/lib/store";
import { ListingCard } from "@/components/listing-card";
import { StateBadge } from "@/components/state-badge";
import { CONTRACT_INFO } from "@/lib/contract";
import { shortenAddress, timeAgo, formatMATIC } from "@/lib/format";
import { IPFSImage } from "@/components/ipfs-image";
import { cn, isSameAddress } from "@/lib/utils";

export function HomeView() {
  const setView = useAppStore((s) => s.setView);
  const setTransactionsTab = useAppStore((s) => s.setTransactionsTab);
  const openTransaction = useAppStore((s) => s.openTransaction);
  const listings = useListingsStore((s) => s.listings);
  const transactions = useEscrowStore((s) => s.transactions);
  const wallet = useWalletStore((s) => s.wallet);

  const safeTransactions = useMemo(() => {
    return (transactions || []).filter((t) => Boolean(t));
  }, [transactions]);

  const totalVolume = useMemo(() => {
    return safeTransactions
      .filter((t) => t.state === "RELEASED")
      .reduce((sum, t) => sum + (t.amountMatic || 0), 0);
  }, [safeTransactions]);

  const totalEscrow = useMemo(() => {
    return safeTransactions
      .filter((t) => t.state === "HELD" || t.state === "DEPOSITED")
      .reduce((sum, t) => sum + (t.amountMatic || 0), 0);
  }, [safeTransactions]);

  const releasedCount = useMemo(() => {
    return safeTransactions.filter((t) => t.state === "RELEASED").length;
  }, [safeTransactions]);

  const refundedCount = useMemo(() => {
    return safeTransactions.filter((t) => t.state === "REFUNDED").length;
  }, [safeTransactions]);

  const userTransactions = useMemo(() => {
    if (wallet.status !== "connected" || !wallet.address) return safeTransactions;
    return safeTransactions.filter(
      (t) =>
        isSameAddress(t.buyer, wallet.address) ||
        isSameAddress(t.seller, wallet.address),
    );
  }, [safeTransactions, wallet]);

  // Current active escrow (HERO preview)
  const activeEscrow = useMemo(() => {
    return (
      userTransactions.find((t) => t.state === "REFUND_REQUESTED") ||
      userTransactions.find((t) => t.state === "HELD") ||
      userTransactions.find((t) => t.state === "DEPOSITED")
    );
  }, [userTransactions]);

  return (
    <div className="animate-fade-slide-up">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.78 0.18 155 / 0.15), transparent)",
          }}
        />
        <div className="relative px-4 md:px-6 py-16 md:py-20 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 items-start">
            {/* Left: headline */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 mb-5">
                <Shield className="size-3 text-primary" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-primary">
                  Keamanan Terjamin 100%
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-5">
                Jual Beli Akun Game,{" "}
                <span className="text-gradient-primary">Tanpa Khawatir.</span>
                <br />
                <span className="text-muted-foreground text-3xl md:text-4xl lg:text-5xl font-medium">
                  Otomatis & Terdesentralisasi.
                </span>
              </h1>

              <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed mb-7">
                RekberIn mengamankan dana pembeli secara otomatis di dalam{" "}
                <span className="text-foreground font-medium">
                  Smart Contract
                </span>{" "}
                (berbasis blockchain). Dana hanya akan diteruskan ke penjual setelah pembeli mengonfirmasi akun telah diterima. Tidak ada pihak perantara.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    setView("transactions");
                    setTransactionsTab("active");
                  }}
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-all shadow-sm"
                >
                  <Shield className="size-4" />
                  Buka Dashboard Escrow
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => setView("marketplace")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/60 text-sm font-medium transition-all"
                >
                  Jelajahi Marketplace
                </button>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 pt-6 border-t border-border/40">
                <StatBox
                  label="Total Dana Dilepas"
                  value={formatMATIC(totalVolume)}
                  sub={`${releasedCount} transaksi`}
                  tone="success"
                />
                <StatBox
                  label="Sedang Di-Hold"
                  value={formatMATIC(totalEscrow)}
                  sub={`${transactions.filter((t) => t.state === "HELD").length} aktif`}
                  tone="warning"
                />
                <StatBox
                  label="Listing Aktif"
                  value={String(listings.length)}
                  sub="di marketplace"
                  tone="info"
                />
                <StatBox
                  label="Rasio Refund"
                  value={`${refundedCount}/${releasedCount + refundedCount}`}
                  sub="on-chain"
                  tone="muted"
                />
              </div>
            </div>

            {/* Right: Current Escrow preview (HERO) */}
            <div className="lg:sticky lg:top-20">
              {activeEscrow ? (
                <CurrentEscrowPreview
                  txId={activeEscrow.id}
                  state={activeEscrow.state}
                  amount={activeEscrow.amountMatic}
                  listingTitle={activeEscrow.listing?.title || "Game Account"}
                  listingImageUrl={activeEscrow.listing?.imageUrl || ""}
                  sellerName={activeEscrow.listing?.sellerName || "Seller"}
                  updatedAt={activeEscrow.updatedAt}
                  onOpen={() => openTransaction(activeEscrow.id)}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <Shield className="size-8 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Belum ada transaksi
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Beli produk di Marketplace untuk memulai transaksi baru.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============= Current Escrow Preview Card (HERO) =============

function CurrentEscrowPreview({
  txId,
  state,
  amount,
  listingTitle,
  listingImageUrl,
  sellerName,
  updatedAt,
  onOpen,
}: {
  txId: string;
  state: "DEPOSITED" | "HELD" | "RELEASED" | "REFUNDED" | "DISPUTED" | "NONE" | "REFUND_REQUESTED";
  amount: number;
  listingTitle: string;
  listingImageUrl?: string;
  sellerName: string;
  updatedAt: number;
  onOpen: () => void;
}) {
  const narrative =
    state === "HELD"
      ? "Menunggu Konfirmasi Pembeli"
      : state === "DEPOSITED"
        ? "Menunggu Pengiriman Akun"
        : state === "RELEASED"
          ? "Transaksi Selesai & Dana Dilepas"
          : state === "REFUNDED"
            ? "Dana Berhasil Dikembalikan"
            : state === "REFUND_REQUESTED"
              ? "Permintaan Refund Diajukan"
              : "Transaksi Berjalan";

  return (
    <button
      onClick={onOpen}
      className="group block w-full text-left rounded-2xl border border-primary/30 bg-card p-5 hover:border-primary/50 hover:bg-card/80 transition-all card-elevated"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold">
          ● Escrow Sedang Berjalan
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {txId}
        </span>
      </div>

      <h3 className="text-xl font-bold leading-tight mb-1 text-foreground">{narrative}</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Diperbarui {timeAgo(updatedAt)}
      </p>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Status FSM
        </span>
        <StateBadge state={state} size="md" pulse={state === "HELD" || state === "DEPOSITED"} />
      </div>

      {/* Listing mini */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/50 mb-4">
        <div
          className={cn(
            "size-9 rounded-md bg-muted/20 flex items-center justify-center overflow-hidden border border-border shrink-0"
          )}
        >
          {listingImageUrl ? (
            <IPFSImage src={listingImageUrl} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br flex items-center justify-center opacity-80 from-indigo-500/20 to-purple-500/20">
              <span className="text-4xl drop-shadow-md">🎮</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium line-clamp-1 text-foreground">{listingTitle}</div>
          <div className="text-[10px] font-mono text-muted-foreground">
            Penjual: {sellerName}
          </div>
        </div>
      </div>

      {/* Amount + CTA */}
      <div className="flex items-end justify-between pt-3 border-t border-border/40">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-0.5">
            Nominal Transaksi
          </div>
          <div className="font-mono-num text-base font-bold text-primary">
            {formatMATIC(amount)}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all">
          Buka Dashboard
          <ArrowRight className="size-3.5" />
        </div>
      </div>
    </button>
  );
}

// ============= StatBox =============

function StatBox({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "success" | "warning" | "info" | "muted";
}) {
  const toneClass = {
    success: "text-success",
    warning: "text-warning",
    info: "text-info",
    muted: "text-muted-foreground",
  }[tone];

  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`font-mono-num font-semibold text-lg ${toneClass}`}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground/60">{sub}</div>
    </div>
  );
}

// ============= FSM diagram nodes =============

function FSMNode({
  icon: Icon,
  label,
  state,
  tone,
  desc,
}: {
  icon: typeof Lock;
  label: string;
  state: string;
  tone: "info" | "warning" | "success";
  desc: string;
}) {
  const toneClass = {
    info: "border-info/30 bg-info/5 text-info",
    warning: "border-warning/30 bg-warning/5 text-warning",
    success: "border-success/30 bg-success/5 text-success",
  }[tone];

  return (
    <div className="flex flex-col items-center text-center gap-2 flex-1 min-w-0">
      <div
        className={cn(
          "size-14 rounded-xl border flex items-center justify-center",
          toneClass,
        )}
      >
        <Icon className="size-6" />
      </div>
      <div>
        <div className="font-mono text-xs font-bold uppercase tracking-wider">
          {label}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function FSMArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <ArrowRight className="size-4 text-muted-foreground hidden md:block" />
      <ArrowRight className="size-4 text-muted-foreground rotate-90 md:hidden" />
      <span className="text-[9px] font-mono text-muted-foreground/70 whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}
