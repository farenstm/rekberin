"use client";

import {
  Loader2,
  Check,
  X,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { useAppStore, useEscrowStore } from "@/lib/store";
import { CONTRACT_INFO } from "@/lib/contract";
import { shortenAddress, formatMATIC } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MetaMaskModal() {
  const { metamaskModal, confirmMetaMask, rejectMetaMask, closeMetaMask } =
    useAppStore();
  const tx = useEscrowStore((s) => {
    const id = useAppStore.getState().selectedTransactionId;
    return id ? s.getById(id) : undefined;
  });

  if (!metamaskModal.open) return null;

  const { step, title, description, action, amountLabel } = metamaskModal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={step === "review" ? rejectMetaMask : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-fade-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>🦊</span>
            <span className="font-semibold text-sm">MetaMask</span>
          </div>
          {step === "review" && (
            <button
              onClick={rejectMetaMask}
              className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Body — Review Step */}
        {step === "review" && (
          <div className="p-4 space-y-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Transaction Request
              </div>
              <h3 className="font-semibold text-base">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>

            {/* Contract call info */}
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Contract</span>
                <span className="font-mono text-foreground/80">
                  {shortenAddress(CONTRACT_INFO.address)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Function</span>
                <span className="font-mono text-primary font-medium">
                  {action}()
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Network</span>
                <span className="font-mono text-foreground/80">
                  {CONTRACT_INFO.network}
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Amount</span>
                <span className="font-mono-num text-base font-semibold text-primary">
                  {amountLabel}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Gas (est.)</span>
                <span className="font-mono text-foreground/80">
                  0.00184 MATIC
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={rejectMetaMask}
                className="px-3 py-2.5 rounded-lg border border-border hover:bg-muted/30 text-sm font-medium transition-all"
              >
                Reject
              </button>
              <button
                onClick={confirmMetaMask}
                className="px-3 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-all glow-primary"
              >
                Approve
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/60 text-center">
              Smart contract RekberIn akan memproses transaksi on-chain.
            </p>
          </div>
        )}

        {/* Body — Pending Step */}
        {step === "pending" && (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto size-14 rounded-full border-2 border-primary/30 border-t-primary flex items-center justify-center">
              <Loader2 className="size-6 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Processing on-chain</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Menunggu konfirmasi jaringan Polygon Amoy...
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Action</span>
                <span className="font-mono text-primary">{action}()</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-mono-num text-foreground/80">
                  {amountLabel}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Status</span>
                <span className="flex items-center gap-1.5 text-warning font-mono">
                  <span className="size-1.5 rounded-full bg-warning animate-pulse-soft" />
                  Pending
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Body — Confirmed Step */}
        {step === "confirmed" && (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto size-14 rounded-full bg-success/15 border-2 border-success/30 flex items-center justify-center">
              <Check className="size-7 text-success" strokeWidth={3} />
            </div>
            <div>
              <h3 className="font-semibold text-base">Transaction confirmed</h3>
              <p className="text-sm text-muted-foreground mt-1">
                State escrow telah berubah di smart contract.
              </p>
            </div>
            <div className="rounded-lg border border-success/20 bg-success/5 p-3 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Action</span>
                <span className="font-mono text-success">{action}()</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Block</span>
                <span className="font-mono-num text-foreground/80">
                  #{(6_483_189 + Math.floor(Math.random() * 1000)).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Status</span>
                <span className="flex items-center gap-1.5 text-success font-mono">
                  <Check className="size-3" />
                  Confirmed
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
