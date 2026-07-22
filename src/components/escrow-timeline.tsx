"use client";

import { Shield, Lock, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EscrowState, EscrowTransaction } from "@/lib/types";

interface EscrowTimelineProps {
  tx: EscrowTransaction;
  variant?: "full" | "compact";
}

interface TimelineStep {
  key: string;
  label: string;
  description: string;
  icon: typeof Shield;
  completed: boolean;
  active: boolean;
  tone: "info" | "warning" | "success" | "destructive" | "refund-req";
  txHash?: string;
}

const TONE_STYLES = {
  info: {
    completed: "border-info bg-info/15 text-info",
    active: "border-info bg-info/15 text-info animate-pulse-ring",
    pending: "border-border bg-muted/30 text-muted-foreground",
    text: "text-info",
  },
  warning: {
    completed: "border-warning bg-warning/15 text-warning",
    active: "border-warning bg-warning/15 text-warning animate-pulse-ring",
    pending: "border-border bg-muted/30 text-muted-foreground",
    text: "text-warning",
  },
  success: {
    completed: "border-success bg-success/15 text-success",
    active: "border-success bg-success/15 text-success animate-pulse-ring",
    pending: "border-border bg-muted/30 text-muted-foreground",
    text: "text-success",
  },
  destructive: {
    completed: "border-destructive bg-destructive/15 text-destructive",
    active: "border-destructive bg-destructive/15 text-destructive animate-pulse-ring",
    pending: "border-border bg-muted/30 text-muted-foreground",
    text: "text-destructive",
  },
  "refund-req": {
    completed: "border-orange-400 bg-orange-400/15 text-orange-400",
    active: "border-orange-400 bg-orange-400/15 text-orange-400 animate-pulse-ring",
    pending: "border-border bg-muted/30 text-muted-foreground",
    text: "text-orange-400",
  },
} as const;

export function EscrowTimeline({ tx, variant = "full" }: EscrowTimelineProps) {
  // Build steps dynamically based on transaction state
  // Two paths:
  //   Release path: DEPOSITED → HELD → RELEASED
  //   Refund path:  DEPOSITED → HELD → REFUND_REQUESTED → REFUNDED
  const steps = buildSteps(tx);

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {steps.map((step, i) => {
          const style = TONE_STYLES[step.tone];
          return (
            <div key={step.key} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono uppercase tracking-wider font-semibold",
                  step.completed && style.completed,
                  step.active && style.active,
                  !step.completed && !step.active && style.pending,
                )}
              >
                {step.completed ? (
                  <CheckCircle2 className="size-3" />
                ) : step.active ? (
                  <Clock className="size-3" />
                ) : (
                  <step.icon className="size-3" />
                )}
                {step.label}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px w-4",
                    steps[i + 1].completed ? "bg-success/40" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const style = TONE_STYLES[step.tone];
        return (
          <div key={step.key} className="flex gap-4">
            {/* Left rail */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "size-9 rounded-full flex items-center justify-center border-2 shrink-0 transition-all",
                  step.completed && style.completed,
                  step.active && style.active,
                  !step.completed && !step.active && style.pending,
                )}
              >
                {step.completed ? (
                  <CheckCircle2 className="size-4" />
                ) : step.active ? (
                  <Clock className="size-4 animate-pulse" />
                ) : (
                  <step.icon className="size-4" />
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-12 mt-1 rounded-full",
                    steps[i + 1].completed ? "bg-success/40" : "bg-border",
                  )}
                />
              )}
            </div>

            {/* Right content */}
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    "font-mono text-sm uppercase tracking-wider font-semibold",
                    step.completed && style.text,
                    step.active && style.text,
                    !step.completed && !step.active && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
                {step.active && (
                  <span
                    className={cn(
                      "text-[10px] font-mono uppercase tracking-wider",
                      style.text,
                      "opacity-70",
                    )}
                  >
                    ● in progress
                  </span>
                )}
                {step.completed && (
                  <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                    ✓ done
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                {step.description}
              </p>

              {/* Tx hash display for completed steps */}
              {step.completed && step.txHash && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/30 border border-border/50 font-mono text-[10px] text-muted-foreground w-fit">
                  <span className="text-foreground/40">tx:</span>
                  <a 
                    href={`https://www.oklink.com/amoy/tx/${step.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono-num text-primary/80 hover:text-primary hover:underline transition-colors flex items-center gap-1"
                  >
                    {step.txHash.slice(0, 10)}...{step.txHash.slice(-8)}
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============= Build steps based on state =============

function buildSteps(tx: EscrowTransaction): TimelineStep[] {
  const isRefundPath =
    tx.state === "REFUND_REQUESTED" ||
    tx.state === "REFUNDED" ||
    tx.events.some((e) => e.event === "RefundRequested");

  // Common first 2 steps
  const depositStep: TimelineStep = {
    key: "DEPOSITED",
    label: "Deposit",
    description: "Buyer mengirim dana ke smart contract. State: DEPOSITED.",
    icon: Lock,
    completed: !!tx.depositTxHash,
    active: tx.state === "DEPOSITED",
    tone: "info",
    txHash: tx.depositTxHash,
  };

  const holdStep: TimelineStep = {
    key: "HELD",
    label: "Hold",
    description: isRefundPath
      ? "Dana ditahan smart contract. Buyer request refund."
      : "Dana ditahan smart contract, menunggu konfirmasi buyer.",
    icon: Shield,
    completed: !!tx.holdTxHash,
    active: tx.state === "HELD",
    tone: "warning",
    txHash: tx.holdTxHash,
  };

  if (!isRefundPath) {
    // Release path
    return [
      depositStep,
      holdStep,
      {
        key: "RELEASED",
        label: "Release",
        description: "Buyer konfirmasi penerimaan akun. Dana dilepas ke seller.",
        icon: CheckCircle2,
        completed: tx.state === "RELEASED",
        active: false,
        tone: "success",
        txHash: tx.releaseTxHash,
      },
    ];
  }

  // Refund path
  return [
    depositStep,
    holdStep,
    {
      key: "REFUND_REQUESTED",
      label: "Refund Requested",
      description:
        "Buyer minta refund. Menunggu approval seller untuk mengembalikan dana.",
      icon: AlertCircle,
      completed: tx.state === "REFUNDED",
      active: tx.state === "REFUND_REQUESTED",
      tone: "refund-req",
      txHash: tx.events.find((e) => e.event === "RefundRequested")?.txHash,
    },
    {
      key: "REFUNDED",
      label: "Refunded",
      description:
        "Seller approve refund. Dana dikembalikan ke buyer. Transaksi selesai.",
      icon: XCircle,
      completed: tx.state === "REFUNDED",
      active: false,
      tone: "destructive",
      txHash: tx.refundTxHash,
    },
  ];
}
