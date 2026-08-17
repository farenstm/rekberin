"use client";

import {
  Tag,
  ShoppingCart,
  Lock,
  Send,
  CheckCircle2,
  ArrowRight,
  Shield,
  AlertCircle,
  XCircle,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function HowItWorksView() {
  return (
    <div className="animate-fade-slide-up">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.78 0.18 155 / 0.15), transparent)",
          }}
        />
        <div className="relative px-4 md:px-6 py-12 md:py-16 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 mb-5">
            <BookOpen className="size-3 text-primary" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-primary">
              Cara Kerja Escrow
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-4 max-w-3xl">
            Alur lengkap{" "}
            <span className="text-gradient-primary">Smart Contract Escrow</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            Dari seller membuat listing sampai dana dilepas ke seller (atau
            dikembalikan ke buyer). Setiap langkah dieksekusi & dicatat on-chain
            oleh smart contract EscrowChain di Polygon Amoy.
          </p>
        </div>
      </section>

      {/* Main flow — 6 steps */}
      <section className="px-4 md:px-6 py-12 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Happy Path — Successful Transaction
          </span>
          <h2 className="text-xl md:text-2xl font-bold mt-2">
            Alur normal (release)
          </h2>
        </div>

        <div className="space-y-1">
          <FlowStep
            num={1}
            icon={Tag}
            title="Seller membuat listing"
            description="Seller mempublikasikan akun game ke marketplace. Metadata listing (judul, harga, deskripsi, kontak) di-upload ke IPFS, lalu listing didaftarkan di smart contract via createListing()."
            actor="Seller"
            tone="info"
            contractCall="createListing(priceWei, ipfsCid)"
          />
          <FlowArrow label="Listing live di marketplace" />
          <FlowStep
            num={2}
            icon={ShoppingCart}
            title="Buyer membuat Escrow"
            description="Buyer browse marketplace, pilih listing, klik Buy Now. Buyer approve transaksi createEscrow() dengan amount = price. Dana terkirim ke smart contract dan state langsung menjadi HELD."
            actor="Buyer"
            tone="info"
            contractCall="createEscrow(listingId) {value: price}"
          />
          <FlowArrow label="State: NONE → HELD" />
          <FlowStep
            num={3}
            icon={Lock}
            title="Smart Contract menahan dana (HELD)"
            description="Dana dikunci secara aman di dalam smart contract EscrowChain. Seller melihat notifikasi bahwa buyer sudah deposit dan siap mengirimkan kredensial akun."
            actor="Smart Contract"
            tone="warning"
            contractCall="escrow.state = HELD"
          />
          <FlowArrow label="Dana dikunci di Smart Contract" />
          <FlowStep
            num={4}
            icon={Send}
            title="Seller mengirim akun (off-chain)"
            description="Seller menghubungi buyer via Discord/Telegram/WhatsApp (yang tertera di listing). Seller memberikan kredensial akun langsung ke buyer. Serah terima ini terjadi OFF-CHAIN — di luar smart contract."
            actor="Seller"
            tone="warning"
            contractCall="— off-chain delivery —"
          />
          <FlowArrow label="Buyer menerima & verifikasi akun" />
          <FlowStep
            num={5}
            icon={CheckCircle2}
            title="Buyer konfirmasi penerimaan"
            description="Buyer login ke akun, verifikasi semua sesuai deskripsi. Buyer klik 'Akun Sudah Diterima' di dashboard. Transaksi confirmReceipt() memicu pelepasan dana."
            actor="Buyer"
            tone="success"
            contractCall="confirmReceipt(escrowId)"
          />
          <FlowArrow label="State: HELD → RELEASED" />
          <FlowStep
            num={6}
            icon={Shield}
            title="Dana dilepas ke seller"
            description="Smart contract otomatis mengirim dana ke wallet seller. State berubah menjadi RELEASED. Listing berubah menjadi SOLD. Transaksi selesai. Semua event tercatat permanen on-chain."
            actor="Smart Contract"
            tone="success"
            contractCall="seller.call{value: amount}"
          />
        </div>
      </section>

      {/* Refund flow */}
      <section className="px-4 md:px-6 py-12 border-t border-border/60 bg-muted/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400">
              Alternate Path — Buyer Request Refund
            </span>
            <h2 className="text-xl md:text-2xl font-bold mt-2">
              Alur refund (3 langkah)
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto mt-2">
              Kalau buyer tidak puas / tidak menerima akun, bisa request refund
              selama state HELD. Refund membutuhkan approval dari seller.
            </p>
          </div>

          <div className="space-y-1">
            <FlowStep
              num="R1"
              icon={AlertCircle}
              title="Buyer request refund"
              description="Buyer klik 'Request Refund' di escrow dashboard. Smart contract mencatat permintaan refund. State berubah dari HELD → REFUND_REQUESTED."
              actor="Buyer"
              tone="refund-req"
              contractCall="requestRefund(escrowId)"
            />
            <FlowArrow label="State: HELD → REFUND_REQUESTED" tone="refund-req" />
            <FlowStep
              num="R2"
              icon={RotateCcw}
              title="Seller approve / reject refund"
              description="Seller login, lihat detail request refund. Seller bisa: (a) Approve — setuju refund (state → REFUNDED), atau (b) Reject — menolak (state kembali → HELD)."
              actor="Seller"
              tone="refund-req"
              contractCall="approveRefund(escrowId) | rejectRefund(escrowId)"
            />
            <FlowArrow
              label="State: REFUND_REQUESTED → REFUNDED (approve) atau HELD (reject)"
              tone="destructive"
            />
            <FlowStep
              num="R3"
              icon={XCircle}
              title="Dana dikembalikan ke buyer"
              description="Jika seller approve: smart contract otomatis mengirim dana kembali ke wallet buyer. State → REFUNDED. Transaksi selesai."
              actor="Smart Contract"
              tone="destructive"
              contractCall="buyer.call{value: amount}"
            />
          </div>
        </div>
      </section>

      {/* FSM diagram */}
      <section className="px-4 md:px-6 py-12 max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary">
            Finite State Machine
          </span>
          <h2 className="text-xl md:text-2xl font-bold mt-2">
            State transition diagram
          </h2>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 card-elevated">
          <pre className="text-xs md:text-sm font-mono leading-relaxed overflow-x-auto">
            <code>
              <span className="text-muted-foreground">                    ┌─── createEscrow() ───▶ </span>
              <span className="text-warning">HELD</span>
              {"\n"}
              <span className="text-muted-foreground">                    │                          │</span>
              {"\n"}
              <span className="text-muted-foreground">                    │                          ├── </span>
              <span className="text-success">confirmReceipt()</span>
              <span className="text-muted-foreground"> ──▶ </span>
              <span className="text-success">RELEASED</span>
              {"\n"}
              <span className="text-muted-foreground">                    │                          │</span>
              {"\n"}
              <span className="text-muted-foreground">                    │                          └── </span>
              <span className="text-orange-400">requestRefund()</span>
              <span className="text-muted-foreground"> ──▶ </span>
              <span className="text-orange-400">REFUND_REQUESTED</span>
              {"\n"}
              <span className="text-muted-foreground">                    │                                               │</span>
              {"\n"}
              <span className="text-muted-foreground">                    │                                          ┌──── </span>
              <span className="text-destructive">approveRefund()</span>
              <span className="text-muted-foreground"> ──▶ </span>
              <span className="text-destructive">REFUNDED</span>
              {"\n"}
              <span className="text-muted-foreground">                    │                                          │</span>
              {"\n"}
              <span className="text-muted-foreground">                    │                                          └── </span>
              <span className="text-warning">rejectRefund()</span>
              <span className="text-muted-foreground"> ──▶ </span>
              <span className="text-warning">HELD</span>
              <span className="text-muted-foreground"> (kembali)</span>
              {"\n"}
              <span className="text-muted-foreground">                    ▼</span>
              {"\n"}
              <span className="text-muted-foreground">                  </span>
              <span className="text-muted-foreground">NONE</span>
            </code>
          </pre>
        </div>
      </section>
    </div>
  );
}

// ============= Sub-components =============

const TONE_CLASSES = {
  info: "border-info/30 bg-info/5 text-info",
  warning: "border-warning/30 bg-warning/5 text-warning",
  success: "border-success/30 bg-success/5 text-success",
  destructive: "border-destructive/30 bg-destructive/5 text-destructive",
  "refund-req": "border-orange-400/30 bg-orange-400/5 text-orange-400",
} as const;

function FlowStep({
  num,
  icon: Icon,
  title,
  description,
  actor,
  tone,
  contractCall,
}: {
  num: number | string;
  icon: typeof Tag;
  title: string;
  description: string;
  actor: string;
  tone: keyof typeof TONE_CLASSES;
  contractCall: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 card-elevated">
      <div className="flex items-start gap-4">
        {/* Number + icon */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div
            className={cn(
              "size-12 rounded-xl border flex items-center justify-center",
              TONE_CLASSES[tone],
            )}
          >
            <Icon className="size-5" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            #{num}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-semibold text-base">{title}</h3>
            <span
              className={cn(
                "text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border",
                TONE_CLASSES[tone],
              )}
            >
              {actor}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {description}
          </p>

          {/* Contract call */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0d1117] border border-border/50 font-mono text-[11px] text-muted-foreground w-fit">
            <span className="text-foreground/40">call:</span>
            <span className="text-primary">{contractCall}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowArrow({
  label,
  tone = "info",
}: {
  label: string;
  tone?: "info" | "warning" | "destructive" | "refund-req";
}) {
  const toneText = {
    info: "text-info",
    warning: "text-warning",
    destructive: "text-destructive",
    "refund-req": "text-orange-400",
  }[tone];

  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <div className="h-px w-12 bg-border" />
      <div className="flex flex-col items-center gap-1">
        <ArrowRight className={cn("size-4 rotate-90", toneText)} />
        <span className={cn("text-[10px] font-mono uppercase tracking-wider", toneText)}>
          {label}
        </span>
      </div>
      <div className="h-px w-12 bg-border" />
    </div>
  );
}
