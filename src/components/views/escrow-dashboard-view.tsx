"use client";

import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Lock,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  User,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  MessageCircle,
  Phone,
  FileCode2,
} from "lucide-react";
import { useAppStore, useEscrowStore, useWalletStore } from "@/lib/store";
import { StateBadge } from "@/components/state-badge";
import { EscrowTimeline } from "@/components/escrow-timeline";
import { IPFSImage } from "@/components/ipfs-image";
import {
  formatIDR,
  formatMATIC,
  shortenAddress,
  shortenHash,
  formatDate,
  timeAgo,
} from "@/lib/format";
import { CONTRACT_INFO } from "@/lib/contract";
import { cn, isSameAddress } from "@/lib/utils";
import type { EscrowState, EscrowTransaction, Listing } from "@/lib/types";
import {
  confirmReceiptOnChain,
  requestRefundOnChain,
  approveRefundOnChain,
  rejectRefundOnChain,
} from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function EscrowDashboardView() {
  const selectedTxId = useAppStore((s) => s.selectedTransactionId);
  const transactions = useEscrowStore((s) => s.transactions);
  const setView = useAppStore((s) => s.setView);
  const setTransactionsTab = useAppStore((s) => s.setTransactionsTab);

  const wallet = useWalletStore((s) => s.wallet);

  if (wallet.status !== "connected") {
    return (
      <div className="px-4 py-24 flex flex-col items-center justify-center text-center">
        <h3 className="text-xl font-bold mb-2">Hubungkan Wallet Anda 🔒</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Active Escrow bersifat privat. Silakan hubungkan wallet Web3 Anda untuk melihat dan mengelola transaksi escrow Anda.
        </p>
      </div>
    );
  }

  // Sort all transactions newest first
  const allSorted = [...(transactions || [])].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  // Filter transactions for the current connected wallet
  const userTransactions = allSorted.filter(
    (t) =>
      isSameAddress(t.buyer, wallet.address) ||
      isSameAddress(t.seller, wallet.address),
  );

  const pool = userTransactions.length > 0 ? userTransactions : allSorted;

  // Active Escrow tab ONLY shows transactions currently in progress
  const activeTxs = pool.filter(
    (t) => t.state === "REFUND_REQUESTED" || t.state === "HELD" || t.state === "DEPOSITED"
  );

  const activeTx = activeTxs[0] || null;

  const selectedCandidate = selectedTxId
    ? allSorted.find((t) => t.id === selectedTxId)
    : null;

  const isSelectedActive =
    selectedCandidate &&
    (selectedCandidate.state === "HELD" ||
      selectedCandidate.state === "REFUND_REQUESTED" ||
      selectedCandidate.state === "DEPOSITED");

  const tx = isSelectedActive ? selectedCandidate : activeTx;

  if (!tx) {
    return (
      <div className="px-4 py-24 flex flex-col items-center justify-center text-center">
        <h3 className="text-xl font-bold mb-2">Tidak Ada Transaksi Aktif 🍃</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
          Saat ini Anda tidak memiliki transaksi escrow yang sedang berjalan. Semua transaksi Anda yang telah selesai dapat dilihat di tab History.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => setView("marketplace")}
            className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Jelajahi Marketplace
          </button>
          <button
            onClick={() => setTransactionsTab("history")}
            className="px-6 py-2.5 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 transition-all border border-border"
          >
            Lihat Riwayat (History)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {activeTxs.length > 1 && (
        <div className="border-b border-border/60 bg-muted/20 px-4 md:px-6 py-2.5">
          <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground shrink-0">
              Pilih Transaksi Aktif ({activeTxs.length}):
            </span>
            {activeTxs.map((atx) => {
              const active = atx.id === tx.id;
              return (
                <button
                  key={atx.id}
                  onClick={() => useAppStore.getState().openTransaction(atx.id)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-mono font-medium border transition-all shrink-0 flex items-center gap-1.5",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span>{atx.id}</span>
                  <StateBadge state={atx.state} size="sm" />
                </button>
              );
            })}
          </div>
        </div>
      )}
      <EscrowDetailContent tx={tx} />
    </div>
  );
}

export function EscrowDetailContent({
  tx,
  isHistory = false,
}: {
  tx: EscrowTransaction;
  isHistory?: boolean;
}) {
  const wallet = useWalletStore((s) => s.wallet);
  const isBuyer = Boolean(wallet.address) && isSameAddress(tx.buyer, wallet.address);
  const isSeller = Boolean(wallet.address) && isSameAddress(tx.seller, wallet.address);

  // Status narrative based on state
  const statusNarrative = getStatusNarrative(tx.state);

  return (
    <div>
      {/* HERO — Escrow Header */}
      <div className="border-b border-border/60">
        <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            {/* Left: identity */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {isHistory ? "Detail Transaksi" : "Transaksi Escrow"}
                </span>
                <span className="font-mono text-sm font-semibold text-foreground/80">
                  #{tx.id.replace("#", "")}
                </span>
              </div>

              {/* Big status narrative */}
              <div>
                <h2 className="text-2xl md:text-4xl font-bold leading-tight text-foreground">
                  {statusNarrative.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                  {statusNarrative.subtitle}
                </p>
              </div>

              {/* Big state badge */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Status FSM
                </span>
                <StateBadge
                  state={tx.state}
                  size="lg"
                  pulse={tx.state === "HELD" || tx.state === "DEPOSITED"}
                />
              </div>
            </div>

            {/* Right: amount + meta */}
            <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Nominal Dana Escrow
                </div>
                <div className="font-mono-num text-2xl font-bold text-primary">
                  {formatMATIC(tx.amountMatic)}
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  ≈ {formatIDR(tx.amountIDR)}
                </div>
              </div>
              <div className="text-right pt-2 border-t border-border/60 md:w-full">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-0.5">
                  Pembaruan Terakhir
                </div>
                <div className="font-mono text-xs text-foreground/70">
                  {timeAgo(tx.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
          {/* LEFT — FSM Timeline + Event Log */}
          <div className="space-y-4">
            {/* FSM Timeline (HERO component) */}
            <div className="rounded-xl border border-border bg-card p-5 card-elevated">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-0.5">
                    Alur Transaksi Escrow
                  </div>
                  <h3 className="text-base font-semibold">
                    Status State Machine
                  </h3>
                </div>
                <FSMCompactView state={tx.state} />
              </div>

              <EscrowTimeline tx={tx} variant="full" />
            </div>

            {/* Action panel */}
            <ActionPanel tx={tx} />

            {/* Event log */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-0.5">
                    Log Aktivitas
                  </div>
                  <div className="text-base font-semibold">Log Event Blockchain</div>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {(tx.events || []).length} event
                </span>
              </div>

              <div className="space-y-2">
                {(tx.events || []).map((evt, i) => (
                  <EventLogRow key={evt.id} evt={evt} isFirst={i === 0} />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Parties, Listing, Seller Contacts, Contract */}
          <div className="space-y-4">
            {/* Parties */}
            <div className="rounded-xl border border-border bg-card p-4 card-elevated">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
                Pihak Terlibat
              </div>

              <PartyRow
                role="Pembeli"
                address={tx.buyer}
                label={isBuyer ? "Anda (Wallet Aktif)" : "Pembeli"}
                icon={isBuyer ? Wallet : User}
                tone="info"
              />
              <div className="flex items-center gap-2 my-2 pl-4">
                <div className="h-px flex-1 bg-border" />
                <ArrowRight className="size-3 text-muted-foreground rotate-90" />
                <div className="h-px flex-1 bg-border" />
              </div>
              <PartyRow
                role="Penjual"
                address={tx.seller}
                label={isSeller ? "Anda (Wallet Aktif)" : (tx.listing?.sellerName || "Penjual")}
                icon={isSeller ? Wallet : User}
                tone="warning"
              />
            </div>

            {/* SELLER CONTACTS — wajib tampil */}
            <SellerContactsCard listing={tx.listing} />

            {/* Listing reference */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
                Detail Akun
              </div>
              <div className="flex items-start gap-3">
                <div className="relative size-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-2xl border border-border shrink-0 from-indigo-500/20 to-purple-500/20 overflow-hidden">
                  {tx.listing?.imageUrl ? (
                    <IPFSImage src={tx.listing.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span>🎮</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm line-clamp-1">
                    {tx.listing?.title || "Game Account"}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                    {tx.listing?.game || "Game"}
                  </div>
                  {tx.listing?.cid && (
                    <div className="mt-1 text-[9px] font-mono text-muted-foreground truncate">
                      CID: <span className="text-primary">{tx.listing.cid.slice(0, 14)}...</span>
                    </div>
                  )}
                  {tx.listing?.id && (
                    <button
                      onClick={() => useAppStore.getState().openListing(tx.listing.id)}
                      className="mt-1.5 flex items-center gap-1 text-[10px] text-primary hover:underline"
                    >
                      Buka Detail Listing
                      <ExternalLink className="size-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Smart contract status */}
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Smart Contract
                </span>
              </div>
              <div className="space-y-2">
                <ContractRow label="Name" value={`${CONTRACT_INFO.name}.sol`} />
                <ContractRow label="Address" value={shortenAddress(CONTRACT_INFO.address, 10, 8)} />
                <ContractRow label="Network" value={CONTRACT_INFO.network} />
                <ContractRow label="Deployed" value={`Block #${CONTRACT_INFO.deployBlock.toLocaleString()}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= Status narrative =============

function getStatusNarrative(state: EscrowState): {
  title: string;
  subtitle: string;
} {
  switch (state) {
    case "DEPOSITED":
      return {
        title: "Menunggu Pengiriman Akun",
        subtitle:
          "Pembeli telah melakukan deposit. Menunggu penjual mengirimkan data akun.",
      };
    case "HELD":
      return {
        title: "Menunggu Konfirmasi Pembeli",
        subtitle:
          "Dana aman di-hold oleh Smart Contract. Pembeli memeriksa akun lalu konfirmasi untuk melepas dana atau mengajukan refund.",
      };
    case "REFUND_REQUESTED":
      return {
        title: "Permintaan Refund Diajukan",
        subtitle:
          "Pembeli meminta pengembalian dana. Penjual dapat menyetujui atau menolak permohonan refund.",
      };
    case "RELEASED":
      return {
        title: "Transaksi Selesai & Dana Dilepas",
        subtitle:
          "Dana telah berhasil diteruskan ke wallet penjual. Transaksi escrow selesai.",
      };
    case "REFUNDED":
      return {
        title: "Dana Telah Dikembalikan",
        subtitle:
          "Dana telah dikembalikan ke wallet pembeli. Listing akun kembali tersedia di marketplace.",
      };
    case "DISPUTED":
      return {
        title: "Sengketa Dibuka",
        subtitle: "Transaksi dalam mediasi sengketa.",
      };
    default:
      return {
        title: "Tidak Ada Transaksi Aktif",
        subtitle: "Saat ini tidak ada transaksi escrow yang sedang berjalan.",
      };
  }
}

// ============= Sub-components =============

function SellerContactsCard({ listing }: { listing?: Listing }) {
  if (!listing) return null;
  const hasAnyContact = listing.discord || listing.telegram || listing.whatsapp;
  if (!hasAnyContact) return null;

  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="size-3.5 text-warning" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-warning font-semibold">
          Kontak Penjual — Penyerahan Akun
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
        Serah terima akun dilakukan secara personal. Hubungi seller melalui kontak
        berikut setelah pembayaran diamankan oleh sistem.
      </p>
      <div className="space-y-2">
        {listing.discord && (
          <ContactRow icon={MessageCircle} label="Discord" value={listing.discord} />
        )}
        {listing.telegram && (
          <ContactRow icon={Send} label="Telegram" value={listing.telegram} />
        )}
        {listing.whatsapp && (
          <ContactRow icon={Phone} label="WhatsApp" value={`+${listing.whatsapp}`} />
        )}
      </div>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-card/60 border border-border/50">
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="size-3.5 text-muted-foreground shrink-0" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground shrink-0">
          {label}
        </span>
      </div>
      <span className="font-mono text-xs text-foreground/80 truncate">
        {value}
      </span>
    </div>
  );
}

function PartyRow({
  role,
  address,
  label,
  icon: Icon,
  tone,
}: {
  role: string;
  address: string;
  label: string;
  icon: typeof Wallet;
  tone: "info" | "warning";
}) {
  const toneClass = {
    info: "border-info/30 bg-info/5 text-info",
    warning: "border-warning/30 bg-warning/5 text-warning",
  }[tone];

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "size-10 rounded-lg border flex items-center justify-center shrink-0",
          toneClass,
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {role}
          </span>
          <span className="text-xs text-muted-foreground/70">•</span>
          <span className="text-xs text-foreground/80">{label}</span>
        </div>
        <div className="font-mono text-xs text-foreground/80 mt-0.5 truncate">
          {address}
        </div>
      </div>
    </div>
  );
}

function ContractRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground/80">{value}</span>
    </div>
  );
}

function FSMCompactView({ state }: { state: EscrowState }) {
  const isRefundPath = state === "REFUND_REQUESTED" || state === "REFUNDED";

  if (isRefundPath) {
    const labels = ["Held", "Refund Req", state === "REFUNDED" ? "Refunded" : ""];
    const stateIdx = state === "REFUNDED" ? 2 : 1;
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50">
        {labels.map((label, i) => {
          if (!label) return null;
          const done = i < stateIdx;
          const active = i === stateIdx && !done;
          const tone = i === 1 ? "orange-400" : i === 2 ? "destructive" : "warning";
          return (
            <div key={label} className="flex items-center gap-1.5">
              {i > 0 && (
                <div className={`h-px w-3 ${done ? "bg-orange-400/60" : "bg-border"}`} />
              )}
              <div
                className={cn(
                  "size-2 rounded-full",
                  done && `bg-${tone}`,
                  active && `bg-${tone} animate-pulse-soft`,
                  !done && !active && "bg-muted-foreground/40",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-mono uppercase tracking-wider",
                  done && `text-${tone}`,
                  active && `text-${tone}`,
                  !done && !active && "text-muted-foreground/50",
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Release path
  const labels = ["Held", "Release"];
  const stateIdx = state === "RELEASED" ? 1 : 0;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50">
      {labels.map((label, i) => {
        const done = i < stateIdx || state === "RELEASED";
        const active = i === stateIdx && !done;
        const tone = i === 0 ? "warning" : "success";
        return (
          <div key={label} className="flex items-center gap-1.5">
            {i > 0 && (
              <div className={`h-px w-3 ${done ? "bg-success/60" : "bg-border"}`} />
            )}
            <div
              className={cn(
                "size-2 rounded-full",
                done && `bg-${tone}`,
                active && `bg-${tone} animate-pulse-soft`,
                !done && !active && "bg-muted-foreground/40",
              )}
            />
            <span
              className={cn(
                "text-[10px] font-mono uppercase tracking-wider",
                done && `text-${tone}`,
                active && `text-${tone}`,
                !done && !active && "text-muted-foreground/50",
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function EventLogRow({
  evt,
  isFirst,
}: {
  evt: EscrowTransaction["events"][number];
  isFirst: boolean;
}) {
  const toneClass = getEventTone(evt.event);
  return (
    <div className="flex items-start gap-3 p-2.5 rounded-md bg-muted/20 border border-border/40">
      <div
        className={cn(
          "size-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
          toneClass,
        )}
      >
        <span className="text-[10px] font-mono font-bold">
          {evt.event.charAt(0)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-semibold text-foreground">
            {evt.event}
          </span>
          {isFirst && (
            <span className="text-[9px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
              Latest
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-muted-foreground">
          <span>Block #{evt.blockNumber.toLocaleString()}</span>
          <span>•</span>
          <span>{timeAgo(evt.timestamp)}</span>
          <span>•</span>
          <span className="truncate">from {shortenAddress(evt.from, 6, 4)}</span>
        </div>
        <div className="mt-1 font-mono text-[10px] text-muted-foreground/80 flex items-center gap-1">
          tx:
          <a
            href={`https://amoy.polygonscan.com/tx/${evt.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/80 hover:text-primary hover:underline inline-flex items-center gap-1"
          >
            {shortenHash(evt.txHash)}
            <ExternalLink className="size-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

function getEventTone(event: string): string {
  switch (event) {
    case "EscrowCreated":
    case "Deposited":
      return "border-info/30 bg-info/5 text-info";
    case "Held":
      return "border-warning/30 bg-warning/5 text-warning";
    case "RefundRequested":
      return "border-orange-400/30 bg-orange-400/5 text-orange-400";
    case "RefundApproved":
      return "border-destructive/30 bg-destructive/5 text-destructive";
    case "RefundRejected":
      return "border-warning/30 bg-warning/5 text-warning";
    case "Released":
      return "border-success/30 bg-success/5 text-success";
    case "Refunded":
      return "border-destructive/30 bg-destructive/5 text-destructive";
    default:
      return "border-border bg-muted/30 text-muted-foreground";
  }
}

// ============= Action Panel =============

function ActionPanel({ tx }: { tx: EscrowTransaction }) {
  const wallet = useWalletStore((s) => s.wallet);
  const confirmReceipt = useEscrowStore((s) => s.confirmReceipt || s.confirmReceived);
  const requestRefund = useEscrowStore((s) => s.requestRefund);
  const approveRefund = useEscrowStore((s) => s.approveRefund);
  const rejectRefund = useEscrowStore((s) => s.rejectRefund);

  const isBuyer = wallet.status === "connected" && isSameAddress(wallet.address, tx.buyer);
  const isSeller = wallet.status === "connected" && isSameAddress(wallet.address, tx.seller);

  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const txNum = parseInt(tx.id.replace(/\D/g, ""), 10);

  const handleConfirmReceipt = async () => {
    if (!window.confirm("Release dana ke seller? Pastikan Anda sudah menerima akun dan login berhasil.")) return;
    try {
      setIsLoading("confirm");
      const receipt = await confirmReceiptOnChain(txNum);
      confirmReceipt(tx.id, receipt.hash, receipt.blockNumber);
      toast({
        title: "Dana Berhasil Dilepas!",
        description: "Transaksi selesai. Dana telah dikirimkan ke wallet seller.",
      });
    } catch (err: any) {
      toast({
        title: "Transaksi Gagal",
        description: err.shortMessage || err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleRefund = async () => {
    if (!window.confirm("Submit refund request ke seller?")) return;
    try {
      setIsLoading("refund");
      const receipt = await requestRefundOnChain(txNum);
      requestRefund(tx.id, receipt.hash, receipt.blockNumber);
      toast({
        title: "Refund Berhasil Diajukan",
        description: "Permintaan refund telah dikirimkan ke seller.",
      });
    } catch (err: any) {
      toast({
        title: "Transaksi Gagal",
        description: err.shortMessage || err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleApproveRefund = async () => {
    if (!window.confirm("Setujui refund? Dana akan dikembalikan ke buyer.")) return;
    try {
      setIsLoading("approve");
      const receipt = await approveRefundOnChain(txNum);
      approveRefund(tx.id, receipt.hash, receipt.blockNumber);
      toast({
        title: "Refund Disetujui",
        description: "Dana telah berhasil dikembalikan ke buyer.",
      });
    } catch (err: any) {
      toast({
        title: "Transaksi Gagal",
        description: err.shortMessage || err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleRejectRefund = async () => {
    if (!window.confirm("Tolak refund? Escrow kembali ke HELD.")) return;
    try {
      setIsLoading("reject");
      const receipt = await rejectRefundOnChain(txNum);
      rejectRefund(tx.id, receipt.hash, receipt.blockNumber);
      toast({
        title: "Refund Ditolak",
        description: "Permintaan refund ditolak. Transaksi kembali ke status HELD.",
      });
    } catch (err: any) {
      toast({
        title: "Transaksi Gagal",
        description: err.shortMessage || err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        tx.state === "HELD"
          ? "border-warning/30 bg-warning/5"
          : tx.state === "REFUND_REQUESTED"
            ? "border-orange-400/30 bg-orange-400/5"
            : tx.state === "RELEASED"
              ? "border-success/30 bg-success/5"
              : tx.state === "REFUNDED"
                ? "border-destructive/30 bg-destructive/5"
                : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-0.5">
            Action Required
          </div>
          <div className="text-base font-semibold">
            {tx.state === "DEPOSITED" && "Menunggu konfirmasi seller"}
            {tx.state === "HELD" && (isBuyer ? "Konfirmasi penerimaan akun" : "Akun dalam escrow")}
            {tx.state === "REFUND_REQUESTED" && (isSeller ? "Permintaan refund diterima" : "Menunggu keputusan seller")}
            {tx.state === "RELEASED" && "Transaksi selesai"}
            {tx.state === "REFUNDED" && "Refund berhasil"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Your role
          </div>
          <div className="font-mono text-xs font-semibold">
            {isBuyer ? "BUYER" : isSeller ? "SELLER" : "OBSERVER"}
          </div>
        </div>
      </div>

      {tx.state === "DEPOSITED" && (
        <div className="p-3 rounded-lg bg-muted/30 border border-border flex items-start gap-2.5">
          <Clock className="size-4 text-info shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            Buyer sudah deposit. Menunggu seller konfirmasi bahwa akun siap
            dikirim. Smart contract akan otomatis transisi ke state{" "}
            <span className="font-mono text-warning">HELD</span>.
          </div>
        </div>
      )}

      {tx.state === "HELD" && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-2.5">
            <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
            <div className="text-xs text-warning leading-relaxed font-medium">
              Dana <span className="font-mono font-semibold">{formatMATIC(tx.amountMatic)}</span>{" "}
              sedang di-hold smart contract. Seller sudah konfirmasi pengiriman
              akun. Buyer: konfirmasi penerimaan untuk release dana, atau request
              refund.
            </div>
          </div>

          {isBuyer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <button
                onClick={handleConfirmReceipt}
                disabled={isLoading !== null}
                className="flex items-center justify-center gap-2 h-11 rounded-lg bg-success text-success-foreground hover:bg-success/90 text-sm font-semibold transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="size-4" />
                {isLoading === "confirm" ? "Memproses..." : "Akun Sudah Diterima"}
              </button>
              <button
                onClick={handleRefund}
                disabled={isLoading !== null}
                className="flex items-center justify-center gap-2 h-11 rounded-lg border border-orange-400/40 bg-orange-400/5 text-orange-400 hover:bg-orange-400/10 text-sm font-semibold transition-all disabled:opacity-50"
              >
                <RotateCcw className="size-4" />
                {isLoading === "refund" ? "Memproses..." : "Request Refund"}
              </button>
            </div>
          )}

          {!isBuyer && (
            <div className="p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground text-center">
              {isSeller
                ? "Menunggu buyer konfirmasi penerimaan akun atau request refund."
                : "Login sebagai buyer untuk melakukan konfirmasi."}
            </div>
          )}
        </div>
      )}

      {tx.state === "REFUND_REQUESTED" && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-orange-400/10 border border-orange-400/30 flex items-start gap-2.5">
            <AlertCircle className="size-4 text-orange-400 shrink-0 mt-0.5" />
            <div className="text-xs text-orange-400/90 leading-relaxed font-medium">
              {isBuyer ? (
                <>
                  Anda meminta refund sebesar{" "}
                  <span className="font-mono font-semibold">{formatMATIC(tx.amountMatic)}</span>.
                  Menunggu seller untuk mengambil keputusan.
                </>
              ) : isSeller ? (
                <>
                  Buyer meminta refund sebesar{" "}
                  <span className="font-mono font-semibold">{formatMATIC(tx.amountMatic)}</span>.
                  Anda dapat menyetujui (dana kembali ke buyer) atau menolak (escrow kembali ke HELD).
                </>
              ) : (
                <>
                  Buyer meminta refund sebesar{" "}
                  <span className="font-mono font-semibold">{formatMATIC(tx.amountMatic)}</span>.
                  Menunggu keputusan seller.
                </>
              )}
            </div>
          </div>

          {isSeller && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <button
                onClick={handleApproveRefund}
                disabled={isLoading !== null}
                className="flex items-center justify-center gap-2 h-11 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-semibold transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="size-4" />
                {isLoading === "approve" ? "Memproses..." : "Approve Refund"}
              </button>
              <button
                onClick={handleRejectRefund}
                disabled={isLoading !== null}
                className="flex items-center justify-center gap-2 h-11 rounded-lg border border-warning/40 bg-warning/5 text-warning hover:bg-warning/10 text-sm font-semibold transition-all disabled:opacity-50"
              >
                <XCircle className="size-4" />
                {isLoading === "reject" ? "Memproses..." : "Reject Refund"}
              </button>
            </div>
          )}

          {!isBuyer && !isSeller && (
            <div className="p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground text-center">
              Login sebagai seller untuk approve atau reject refund.
            </div>
          )}
        </div>
      )}

      {tx.state === "RELEASED" && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/30 flex items-start gap-2.5">
          <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
          <div className="text-xs text-success-foreground/90 leading-relaxed">
            Pembayaran berhasil diteruskan kepada penjual. Transaksi {tx.id}
            {" "}telah selesai dan listing &ldquo;{tx.listing?.title || tx.id}&rdquo; ({tx.listing?.id || tx.id})
            {" "}ditandai sebagai terjual.
          </div>
        </div>
      )}

      {tx.state === "REFUNDED" && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2.5">
          <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs text-destructive-foreground/90 leading-relaxed">
            Dana dikembalikan ke buyer. Listing {tx.listing?.id || tx.id} kembali AVAILABLE
            di marketplace.
          </div>
        </div>
      )}
    </div>
  );
}
