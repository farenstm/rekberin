"use client";

import {
  ArrowLeft,
  Shield,
  Lock,
  MessageCircle,
  Send,
  Phone,
  CheckCircle2,
  AlertCircle,
  Database,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { useAppStore, useListingsStore, useEscrowStore, useWalletStore } from "@/lib/store";
import { StateBadge } from "@/components/state-badge";
import { IPFSImage } from "@/components/ipfs-image";
import {
  formatIDR,
  formatMATIC,
  shortenAddress,
  timeAgo,
} from "@/lib/format";
import { CONTRACT_INFO } from "@/lib/contract";
import { createEscrowOnChain } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { isSameAddress } from "@/lib/utils";

export function ListingDetailView() {
  const { toast } = useToast();
  const selectedId = useAppStore((s) => s.selectedListingId);
  const setView = useAppStore((s) => s.setView);
  const openTransaction = useAppStore((s) => s.openTransaction);
  const getById = useListingsStore((s) => s.getById);
  const createEscrow = useEscrowStore((s) => s.createEscrow);
  const wallet = useWalletStore((s) => s.wallet);
  const [isBuying, setIsBuying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [copiedCid, setCopiedCid] = useState(false);

  const listing = selectedId ? getById(selectedId) : undefined;

  if (!listing) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Listing tidak ditemukan</p>
        <button
          onClick={() => setView("marketplace")}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Kembali ke marketplace
        </button>
      </div>
    );
  }

  const handleBuy = async () => {
    if (wallet.status !== "connected") {
      toast({
        title: "Koneksi Wallet Diperlukan",
        description: "Silakan hubungkan wallet MetaMask Anda terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsBuying(true);
      const numId = parseInt(listing.id.replace(/\D/g, ""), 10);
      const { receipt, escrowId } = await createEscrowOnChain(numId, listing.priceMatic);
      
      const newTxId = createEscrow(
        listing,
        wallet.address,
        escrowId,
        receipt.hash,
        receipt.blockNumber,
      );
      toast({
        title: "Escrow Berhasil Dibuat!",
        description: `Transaksi #${escrowId} telah berhasil dibuat di blockchain.`,
      });
      openTransaction(newTxId);
    } catch (err: any) {
      console.error(err);
      const message = err?.shortMessage || err?.message || "Transaksi tidak dapat diproses.";
      toast({
        title: "Transaksi Gagal",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsBuying(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Yakin ingin membatalkan listing ini?")) return;
    try {
      setIsCancelling(true);
      const { cancelListingOnChain } = await import("@/lib/web3");
      const numId = parseInt(listing.id.replace(/\D/g, ""), 10);
      await cancelListingOnChain(numId);
      
      const updateStatus = useListingsStore.getState().updateListingStatus;
      updateStatus(listing.id, "CANCELLED");
      
      toast({
        title: "Listing Dibatalkan",
        description: "Listing akun ini telah berhasil dibatalkan.",
      });
      setView("marketplace");
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Gagal Pembatalan",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="animate-fade-slide-up">
      {/* Back */}
      <div className="px-4 md:px-6 py-3 border-b border-border/40">
        <button
          onClick={() => setView("marketplace")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke marketplace
        </button>
      </div>

      <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
          {/* Left: image + description */}
          <div className="space-y-4">
            <div
              className={`relative aspect-[4/3] rounded-xl bg-muted/20 overflow-hidden border border-border card-elevated`}
            >
              {listing.imageUrl ? (
                <IPFSImage src={listing.imageUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br flex items-center justify-center opacity-80 from-indigo-500/20 to-purple-500/20">
                  <span className="text-6xl drop-shadow-md">🎮</span>
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-mono uppercase tracking-wider text-white/90 border border-white/10">
                  {listing.game}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <StateBadge state={listing.status} />
              </div>
              <div className="absolute bottom-3 left-3">
                <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-mono uppercase tracking-wider text-white/90 border border-white/10">
                  {listing.tier}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-border bg-card p-5 card-elevated">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Description
                </span>
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {listing.description}
              </p>

              {/* Features */}
              {(listing.features || []).length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/60">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 block">
                    Highlights
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(listing.features || []).map((f) => (
                      <span
                        key={f}
                        className="px-2 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider bg-muted/40 text-foreground/80 border border-border/50 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="size-3 text-success" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* IPFS Metadata Card */}
            {listing.cid && (
              <div className="rounded-xl border border-border bg-card p-5 card-elevated">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Database className="size-4 text-primary" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Metadata IPFS Terdesentralisasi
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    On-Chain Verified
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Metadata akun game ini tersimpan secara permanen dan immutable di jaringan terdesentralisasi IPFS.
                </p>

                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        IPFS CID (Content Identifier)
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(listing.cid);
                          setCopiedCid(true);
                          setTimeout(() => setCopiedCid(false), 2000);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-primary hover:underline"
                      >
                        {copiedCid ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                        <span>{copiedCid ? "Disalin!" : "Salin CID"}</span>
                      </button>
                    </div>
                    <div className="font-mono text-xs text-foreground break-all bg-background/60 p-2 rounded border border-border/40 select-all">
                      {listing.cid}
                    </div>
                  </div>

                  {/* Gateway Link */}
                  {(listing.cid.startsWith("Qm") || listing.cid.startsWith("bafy")) && (
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${listing.cid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-mono pt-1"
                    >
                      <ExternalLink className="size-3.5" />
                      Buka Metadata Mentah di IPFS Gateway ↗
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: purchase panel */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 card-elevated">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {listing.id}
              </span>
              <h1 className="text-lg font-semibold mt-1 leading-snug">
                {listing.title}
              </h1>

              {/* Price */}
              <div className="mt-4 pt-4 border-t border-border/60">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                      Price
                    </div>
                    <div className="font-mono-num text-2xl font-bold">
                      {formatIDR(listing.priceIDR)}
                    </div>
                    <div className="font-mono text-xs text-primary/80 mt-0.5">
                      ≈ {formatMATIC(listing.priceMatic)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                      Dipublikasikan
                    </div>
                    <div className="font-mono text-xs text-foreground/70">
                      {timeAgo(listing.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Buy button */}
              <button
                onClick={handleBuy}
                disabled={
                  listing.status !== "AVAILABLE" ||
                  (wallet.status === "connected" &&
                    isSameAddress(wallet.address, listing.seller)) ||
                  isBuying
                }
                className="w-full mt-4 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBuying ? (
                  "Memproses Transaksi..."
                ) : listing.status === "AVAILABLE" ? (
                  wallet.status === "connected" && isSameAddress(wallet.address, listing.seller) ? (
                    <>
                      <AlertCircle className="size-4" />
                      Listing Milik Anda Sendiri
                    </>
                  ) : (
                    <>
                      <Lock className="size-4" />
                      Beli Sekarang — {formatMATIC(listing.priceMatic)}
                    </>
                  )
                ) : (
                  <>
                    <AlertCircle className="size-4" />
                    {listing.status === "LOCKED" ? "Sedang Di-Escrow" : "Terjual"}
                  </>
                )}
              </button>

              {/* Edit button */}
              {listing.status === "AVAILABLE" && wallet.status === "connected" && isSameAddress(wallet.address, listing.seller) && (
                <button
                  onClick={() => useAppStore.getState().openEditListing(listing.id)}
                  className="w-full mt-2 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-12 rounded-lg font-semibold transition-all border border-border"
                >
                  Edit Listing
                </button>
              )}

              {/* Cancel button */}
              {listing.status === "AVAILABLE" && wallet.status === "connected" && isSameAddress(wallet.address, listing.seller) && (
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="w-full mt-2 flex items-center justify-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive/20 h-12 rounded-lg font-semibold transition-all border border-destructive/20 disabled:opacity-50"
                >
                  {isCancelling ? "Membatalkan..." : "Batalkan Listing"}
                </button>
              )}

              {/* Escrow info */}
              <div className="mt-3 p-3 rounded-lg bg-muted/20 border border-border/50 flex items-start gap-2.5">
                <Shield className="size-4 text-primary shrink-0 mt-0.5" />
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  Pembayaran dijamin Smart Contract. Dana di-hold secara aman sampai Anda mengonfirmasi penerimaan data akun.
                </div>
              </div>
            </div>

            {/* Seller info */}
            <div className="rounded-xl border border-border bg-card p-5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3 block">
                Informasi Penjual
              </span>
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center border border-primary/30">
                  <span className="font-mono text-sm font-semibold text-primary-foreground">
                    {listing.sellerName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{listing.sellerName}</div>
                  <div className="font-mono text-[11px] text-muted-foreground truncate">
                    {shortenAddress(listing.seller)}
                  </div>
                </div>
              </div>

              {/* Contact channels */}
              <div className="space-y-2">
                {listing.discord && (
                  <ContactRow
                    icon={MessageCircle}
                    label="Discord"
                    value={listing.discord}
                  />
                )}
                {listing.telegram && (
                  <ContactRow
                    icon={Send}
                    label="Telegram"
                    value={listing.telegram}
                  />
                )}
                {listing.whatsapp && (
                  <ContactRow
                    icon={Phone}
                    label="WhatsApp"
                    value={`+${listing.whatsapp}`}
                  />
                )}
              </div>
            </div>

            {/* Contract info */}
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 block">
                Smart Contract
              </span>
              <div className="font-mono text-[11px] text-foreground/70 break-all mb-2">
                {CONTRACT_INFO.address}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <span>{CONTRACT_INFO.network}</span>
                <span>•</span>
                <span>Block #{CONTRACT_INFO.deployBlock.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
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
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-muted/30 border border-border/50">
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
