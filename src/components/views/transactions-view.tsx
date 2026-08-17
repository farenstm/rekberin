"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Gauge, History as HistoryIcon, Activity } from "lucide-react";
import type { TransactionsTab } from "@/lib/types";
import { EscrowDashboardView } from "./escrow-dashboard-view";
import { HistoryView } from "./history-view";
import { ContractStatusView } from "./contract-status-view";

const TABS: Array<{
  id: TransactionsTab;
  label: string;
  icon: typeof Gauge;
  description: string;
}> = [
  { id: "active", label: "Active Escrow", icon: Gauge, description: "Current transaction state machine" },
  { id: "history", label: "History", icon: HistoryIcon, description: "All past transactions" },
  { id: "contract-status", label: "Contract Status", icon: Activity, description: "Live counts & state distribution" },
];

export function TransactionsView() {
  const tab = useAppStore((s) => s.transactionsTab);
  const setTab = useAppStore((s) => s.setTransactionsTab);

  return (
    <div className="animate-fade-slide-up">
      {/* Header */}
      <div className="border-b border-border/60 bg-muted/10">
        <div className="px-4 md:px-6 pt-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Dashboard Transaksi
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            Status Transaksi Escrow
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Pantau status keamanan dana dan riwayat transaksi escrow Anda secara langsung. Buka &apos;Active Escrow&apos; untuk melihat transaksi berjalan, &apos;History&apos; untuk riwayat selesai, dan &apos;Contract Status&apos; untuk melihat statistik jaringan.
          </p>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-5 -mb-px overflow-x-auto">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <t.icon className={cn("size-4", active && "text-primary")} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      {tab === "active" && <EscrowDashboardView />}
      {tab === "history" && <HistoryView />}
      {tab === "contract-status" && <ContractStatusView />}
    </div>
  );
}
