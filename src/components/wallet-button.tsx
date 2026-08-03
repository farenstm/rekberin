"use client";

import { Wallet, LogOut, Loader2, ChevronDown, Network, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/lib/store";
import { shortenAddress } from "@/lib/format";

export function WalletButton() {
  const { wallet, connect, disconnect } = useWalletStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (wallet.status === "disconnected" || wallet.status === "error") {
    return (
      <button
        onClick={connect}
        className="group flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/30 transition-all text-sm font-medium"
      >
        <Wallet className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span>{wallet.status === "error" ? "Connection Failed - Retry" : "Connect Wallet"}</span>
      </button>
    );
  }

  if (wallet.status === "connecting") {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-primary/30 bg-primary/10 text-sm font-medium"
      >
        <Loader2 className="size-4 text-primary animate-spin" />
        <span>Connecting...</span>
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-2.5 px-2.5 py-1.5 rounded-md border border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/30 transition-all text-sm"
      >
        {/* Fox emoji — pengganti MetaMask icon */}
        <span className="text-base leading-none" aria-hidden>🦊</span>
        <div className="flex flex-col items-start leading-none">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success animate-pulse-soft" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-success">
              Connected
            </span>
          </div>
          <span className="font-mono text-xs font-medium font-mono-num mt-0.5">
            {shortenAddress(wallet.address)}
          </span>
        </div>
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-popover p-3 shadow-xl animate-fade-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Wallet
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-success">
              <Check className="size-2.5" />
              Live
            </span>
          </div>

          {/* Wallet info card */}
          <div className="rounded-lg bg-muted/30 border border-border p-3 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl" aria-hidden>🦊</span>
              <div className="flex flex-col leading-none">
                <span className="text-xs font-semibold">MetaMask</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  Browser extension
                </span>
              </div>
              <span className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider text-success bg-success/10 border border-success/30">
                <span className="size-1 rounded-full bg-success animate-pulse-soft" />
                Connected
              </span>
            </div>

            {/* Address */}
            <div className="mb-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Address
              </div>
              <div className="font-mono text-xs text-foreground/90 break-all leading-relaxed">
                {wallet.address}
              </div>
            </div>

            {/* Network */}
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-0.5">
                    Network
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Network className="size-3 text-primary" />
                    <span className="text-xs font-medium text-foreground/90">
                      {wallet.networkName}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-0.5">
                    Chain ID
                  </div>
                  <div className="font-mono text-xs text-foreground/70">
                    {parseInt(wallet.chainId, 16)}
                  </div>
                </div>
              </div>
            </div>

            {/* Balance */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Balance
                </span>
                <span className="font-mono-num text-sm font-semibold text-primary">
                  {wallet.balanceMatic.toFixed(4)} MATIC
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all text-sm font-medium"
          >
            <LogOut className="size-4" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
