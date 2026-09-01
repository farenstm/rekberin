"use client";

import {
  Shield,
  Store,
  PlusSquare,
  Receipt,
  BookOpen,
  Info,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { ViewId } from "@/lib/types";
import { WalletButton } from "./wallet-button";

const NAV_ITEMS: Array<{
  id: ViewId;
  label: string;
  icon: typeof Shield;
  description: string;
}> = [
  { id: "home", label: "Beranda", icon: Shield, description: "Halaman utama" },
  { id: "marketplace", label: "Marketplace", icon: Store, description: "Jelajahi akun game" },
  { id: "transactions", label: "Transaksi", icon: Receipt, description: "Escrow aktif & riwayat" },
  { id: "how-it-works", label: "Cara Kerja", icon: BookOpen, description: "Alur escrow smart contract" },
  { id: "about", label: "Tentang", icon: Info, description: "Tentang platform RekberIn" },
];

export function Navbar() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        document.documentElement.classList.contains("dark") ||
        localStorage.getItem("theme") === "dark"
      );
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <button
          onClick={() => {
            useAppStore.setState({ selectedTransactionId: null });
            setView("home");
          }}
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center border border-primary/30 shadow-sm">
            <Shield className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="font-semibold text-sm tracking-tight text-foreground">
              RekberIn
            </span>
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
              Smart Contract Escrow
            </span>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  useAppStore.setState({ selectedTransactionId: null });
                  setView(item.id);
                }}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  active
                    ? "text-foreground bg-muted/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                )}
              >
                <item.icon className="size-3.5" />
                {item.label}
                {active && (
                  <span className="absolute -bottom-[1px] left-3 right-3 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          })}

          {/* Jual Akun / Buat Listing */}
          <button
            onClick={() => {
              useAppStore.setState({ selectedTransactionId: null });
              setView("create-listing");
            }}
            className={cn(
              "ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-all",
              view === "create-listing"
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-border bg-card text-foreground hover:bg-muted/50 hover:border-primary/40",
            )}
          >
            <PlusSquare className="size-3.5 text-primary" />
            Jual Akun
          </button>
        </nav>

        {/* Action buttons: Theme Toggle + Wallet Button */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="size-9 rounded-md border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
            title={isDark ? "Ubah ke Mode Terang (Background Putih)" : "Ubah ke Mode Gelap"}
            aria-label="Toggle tema tampilan"
          >
            {isDark ? <Sun className="size-4 text-warning" /> : <Moon className="size-4 text-foreground" />}
          </button>

          <WalletButton />

          <button
            className="lg:hidden size-9 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border/60 bg-background">
          <nav className="grid gap-1 p-3">
            {NAV_ITEMS.map((item) => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    useAppStore.setState({ selectedTransactionId: null });
                    setView(item.id);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all",
                    active
                      ? "bg-muted/60 text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4 text-primary" />
                  <div className="flex flex-col items-start">
                    <span>{item.label}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                </button>
              );
            })}
            <button
              onClick={() => {
                useAppStore.setState({ selectedTransactionId: null });
                setView("create-listing");
                setMobileOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm border transition-all",
                view === "create-listing"
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border text-foreground hover:bg-muted/30",
              )}
            >
              <PlusSquare className="size-4 text-primary" />
              <div className="flex flex-col items-start">
                <span>Jual Akun Game</span>
                <span className="text-[10px] text-muted-foreground">
                  Buat dan publikasikan listing baru
                </span>
              </div>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
