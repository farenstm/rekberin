"use client";

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
import { useAppStore, useListingsStore, useEscrowStore } from "@/lib/store";
import { ListingCard } from "@/components/listing-card";
import { StateBadge } from "@/components/state-badge";
import { CONTRACT_INFO } from "@/lib/contract";
import { formatMATIC, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function HomeView() {
  const setView = useAppStore((s) => s.setView);
  const setTransactionsTab = useAppStore((s) => s.setTransactionsTab);
  const openTransaction = useAppStore((s) => s.openTransaction);
  const listings = useListingsStore((s) => s.listings);
  const transactions = useEscrowStore((s) => s.transactions);

  const totalVolume = transactions
    .filter((t) => t.state === "RELEASED")
    .reduce((sum, t) => sum + t.amountMatic, 0);

  const totalEscrow = transactions
    .filter((t) => t.state === "HELD" || t.state === "DEPOSITED")
    .reduce((sum, t) => sum + t.amountMatic, 0);

  const releasedCount = transactions.filter((t) => t.state === "RELEASED").length;
  const refundedCount = transactions.filter((t) => t.state === "REFUNDED").length;

  // Current active escrow (HERO preview)
  const activeEscrow =
    transactions.find((t) => t.state === "HELD") ||
    transactions.find((t) => t.state === "DEPOSITED");

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
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-all glow-primary"
                >
                  <Shield className="size-4" />
                  Lihat Escrow Dashboard
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => setView("marketplace")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 text-sm font-medium transition-all"
                >
                  Browse Marketplace
                </button>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 pt-6 border-t border-border/40">
                <StatBox
                  label="Total Released"
                  value={formatMATIC(totalVolume)}
                  sub={`${releasedCount} tx`}
                  tone="success"
                />
                <StatBox
                  label="In Escrow"
                  value={formatMATIC(totalEscrow)}
                  sub={`${transactions.filter((t) => t.state === "HELD").length} held`}
                  tone="warning"
                />
                <StatBox
                  label="Active Listings"
                  value={String(listings.length)}
                  sub="marketplace"
                  tone="info"
                />
                <StatBox
                  label="Refund Rate"
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
                  listingTitle={activeEscrow.listing.title}
                  listingImageUrl={activeEscrow.listing.imageUrl}
                  sellerName={activeEscrow.listing.sellerName}
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

      {/* How Escrow Works — FSM */}
      <section className="px-4 md:px-6 py-14 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary">
            Finite State Machine
          </span>
          <h2 className="text-2xl md:text-3xl font-bold mt-2 mb-3">
            Escrow state machine
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Inti penelitian: state machine di smart contract menentukan kapan
            dana boleh berpindah. Setiap transisi adalah event on-chain yang
            tercatat permanen.
          </p>
        </div>

        {/* Big FSM diagram */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 card-elevated">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <FSMNode
              icon={Lock}
              label="Deposit"
              state="DEPOSITED"
              tone="info"
              desc="Buyer → Contract"
            />
            <FSMArrow label="hold()" />
            <FSMNode
              icon={Shield}
              label="Hold"
              state="HELD"
              tone="warning"
              desc="Dana dikunci"
            />
            <FSMArrow label="confirmReceived()" />
            <FSMNode
              icon={CheckCircle2}
              label="Release"
              state="RELEASED"
              tone="success"
              desc="Dana → Seller"
            />
          </div>

          {/* Refund branch */}
          <div className="mt-6 pt-6 border-t border-border/40">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
              <ArrowRight className="size-3" />
              Alternate branch from HELD
            </div>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg border border-warning/30 bg-warning/5 flex items-center justify-center text-warning">
                <Shield className="size-4" />
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground">
                requestRefund()
              </span>
              <ArrowRight className="size-4 text-muted-foreground" />
              <div className="size-9 rounded-lg border border-destructive/30 bg-destructive/5 flex items-center justify-center text-destructive">
                <XCircle className="size-4" />
              </div>
              <span className="font-mono text-sm font-semibold text-destructive">
                REFUNDED
              </span>
              <span className="text-xs text-muted-foreground">Dana → Buyer</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center">
          <button
            onClick={() => {
              setView("transactions");
              setTransactionsTab("contract");
            }}
            className="group flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/30 text-sm transition-all"
          >
            <Zap className="size-4 text-primary" />
            Lihat source code EscrowChain.sol
            <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="px-4 md:px-6 py-12 border-t border-border/60 bg-muted/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Marketplace
              </span>
              <h2 className="text-xl md:text-2xl font-bold mt-1">
                Akun Pilihan
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Koleksi akun game terbaik yang tersedia saat ini.
              </p>
            </div>
            <button
              onClick={() => setView("marketplace")}
              className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
              <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings
              .filter(l => l.status === "AVAILABLE")
              .slice(0, 3)
              .map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      </section>

      {/* Contract callout */}
      <section className="px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <button
          onClick={() => {
            setView("transactions");
            setTransactionsTab("contract");
          }}
          className="group w-full text-left rounded-2xl border border-border bg-card p-6 hover:border-primary/30 hover:bg-card/80 transition-all card-elevated"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  Smart Contract
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Solidity 0.8.20
                </span>
              </div>
              <h3 className="text-lg font-semibold">
                {CONTRACT_INFO.name}.sol
              </h3>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                Deployed on {CONTRACT_INFO.network}. Implements FSM escrow
                pattern dengan role-based access control untuk buyer & seller.
              </p>
              <div className="flex items-center gap-3 pt-2 font-mono text-xs">
                <span className="text-muted-foreground">
                  Address:{" "}
                  <span className="text-foreground/80">
                    {CONTRACT_INFO.address.slice(0, 18)}...
                  </span>
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  Block #{CONTRACT_INFO.deployBlock.toLocaleString()}
                </span>
              </div>
            </div>
            <ArrowRight className="size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
          </div>
        </button>
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
  state: "DEPOSITED" | "HELD" | "RELEASED" | "REFUNDED" | "DISPUTED" | "NONE";
  amount: number;
  listingTitle: string;
  listingImageUrl?: string;
  sellerName: string;
  updatedAt: number;
  onOpen: () => void;
}) {
  const narrative =
    state === "HELD"
      ? "Waiting Buyer Confirmation"
      : state === "DEPOSITED"
        ? "Waiting Seller Confirmation"
        : state === "RELEASED"
          ? "Transaction Completed"
          : state === "REFUNDED"
            ? "Refund Processed"
            : "Active";

  return (
    <button
      onClick={onOpen}
      className="group block w-full text-left rounded-2xl border border-primary/30 bg-card p-5 hover:border-primary/50 hover:bg-card/80 transition-all card-elevated glow-primary"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold">
          ● Current Escrow
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {txId}
        </span>
      </div>

      <h3 className="text-xl font-bold leading-tight mb-1">{narrative}</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Updated {timeAgo(updatedAt)}
      </p>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          State
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
            <img src={listingImageUrl.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className={cn("absolute inset-0 bg-gradient-to-br flex items-center justify-center opacity-80", activeEscrow?.listing.imageColor)}>
              <span className="text-4xl drop-shadow-md">{activeEscrow?.listing.imageEmoji}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium line-clamp-1">{listingTitle}</div>
          <div className="text-[10px] font-mono text-muted-foreground">
            Seller: {sellerName}
          </div>
        </div>
      </div>

      {/* Amount + CTA */}
      <div className="flex items-end justify-between pt-3 border-t border-border/40">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-0.5">
            Amount
          </div>
          <div className="font-mono-num text-base font-bold text-primary">
            {formatMATIC(amount)}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all">
          Open Dashboard
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
