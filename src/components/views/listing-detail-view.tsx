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
} from "lucide-react";
import { useAppStore, useListingsStore, useEscrowStore, useWalletStore } from "@/lib/store";
import { StateBadge } from "@/components/state-badge";
import {
  formatIDR,
  formatMATIC,
  shortenAddress,
  timeAgo,
} from "@/lib/format";
import { CONTRACT_INFO } from "@/lib/contract";
import { createEscrowOnChain } from "@/lib/web3";
import { useState } from "react";

export function ListingDetailView() {
  const selectedId = useAppStore((s) => s.selectedListingId);
  const setView = useAppStore((s) => s.setView);
  const openMetaMask = useAppStore((s) => s.openMetaMask);
  const openTransaction = useAppStore((s) => s.openTransaction);
  const getById = useListingsStore((s) => s.getById);
  const createEscrow = useEscrowStore((s) => s.createEscrow);
  const wallet = useWalletStore((s) => s.wallet);

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

  const [isBuying, setIsBuying] = useState(false);

  const handleBuy = async () => {
    if (wallet.status !== "connected") {
      alert("Connect wallet dulu");
      return;
    }
    try {
      setIsBuying(true);
      const numId = parseInt(listing.id.replace(/\D/g, ""), 10);
      const { escrowId } = await createEscrowOnChain(numId, listing.priceMatic);
      
      const newTxId = createEscrow(listing, wallet.address, escrowId);
      openTransaction(newTxId);
    } catch (err: any) {
      console.error(err);
      alert("Transaksi dibatalkan atau gagal: " + err.message);
    } finally {
      setIsBuying(false);
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
                <img src={listing.imageUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-grid opacity-30" />
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
              {listing.features.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/60">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 block">
                    Highlights
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.features.map((f) => (
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
                      Posted
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
                    wallet.address.toLowerCase() === listing.seller.toLowerCase()) ||
                  isBuying
                }
                className="w-full mt-4 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBuying ? (
                  "Memproses Transaksi..."
                ) : listing.status === "AVAILABLE" ? (
                  wallet.status === "connected" && wallet.address.toLowerCase() === listing.seller.toLowerCase() ? (
                    <>
                      <AlertCircle className="size-4" />
                      Milik Anda Sendiri
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
                    {listing.status === "LOCKED" ? "In Escrow" : "Sold"}
                  </>
                )}
              </button>

              {/* Escrow info */}
              <div className="mt-3 p-3 rounded-lg bg-muted/20 border border-border/50 flex items-start gap-2.5">
                <Shield className="size-4 text-primary shrink-0 mt-0.5" />
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  Pembayaran dijamin smart contract. Dana di-hold sampai Anda
                  konfirmasi penerimaan akun.
                </div>
              </div>
            </div>

            {/* Seller info */}
            <div className="rounded-xl border border-border bg-card p-5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3 block">
                Seller
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
