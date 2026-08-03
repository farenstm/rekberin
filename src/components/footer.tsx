"use client";

import { Shield, Github, FileText } from "lucide-react";
import { CONTRACT_INFO } from "@/lib/contract";
import { shortenAddress } from "@/lib/format";
import { useAppStore } from "@/lib/store";

export function Footer() {
  const setView = useAppStore((s) => s.setView);

  return (
    <footer className="mt-auto border-t border-border/60 bg-background/50">
      <div className="px-4 md:px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="size-6 rounded-md bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center border border-primary/30">
            <Shield className="size-3 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-medium text-foreground">RekberIn</span>
            <span className="text-[10px] text-muted-foreground/70">
              Prototype • {CONTRACT_INFO.network}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono">
          <button
            onClick={() => {
              setView("transactions");
              useAppStore.getState().setTransactionsTab("contract-status");
            }}
            className="hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <FileText className="size-3" />
            {shortenAddress(CONTRACT_INFO.address)}
          </button>
          <span className="text-muted-foreground/40">•</span>
          <span className="text-muted-foreground/70">
            Escrow FSM v1.0.0
          </span>
          <span className="text-muted-foreground/40">•</span>
          <button
            onClick={() => {
              if (window.confirm("Hapus semua data simulasi (Listing & Transaksi)?")) {
                localStorage.removeItem("escrowchain-listings");
                localStorage.removeItem("escrowchain-transactions");
                window.location.reload();
              }
            }}
            className="text-destructive/70 hover:text-destructive transition-colors underline decoration-destructive/30"
          >
            Reset Demo Data
          </button>
        </div>
      </div>
    </footer>
  );
}
