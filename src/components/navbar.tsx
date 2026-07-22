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
} from "lucide-react";
import { useState } from "react";
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
  { id: "home", label: "Home", icon: Shield, description: "Homepage" },
  { id: "marketplace", label: "Marketplace", icon: Store, description: "Browse listings" },
  { id: "transactions", label: "Transactions", icon: Receipt, description: "Escrow, history, contract" },
  { id: "how-it-works", label: "How It Works", icon: BookOpen, description: "Cara kerja escrow" },
  { id: "about", label: "About", icon: Info, description: "Tentang sistem" },
];

export function Navbar() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <button
          onClick={() => {
            useAppStore.setState({ selectedTransactionId: null });
            setView("home");
          }}
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="size-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center border border-primary/30 glow-primary">
            <Shield className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="font-semibold text-sm tracking-tight">
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
                  <span className="absolute -bottom-[1px] left-3 right-3 h-px bg-primary/60" />
                )}
              </button>
            );
          })}

          {/* Create Listing as action button */}
          <button
            onClick={() => {
              useAppStore.setState({ selectedTransactionId: null });
              setView("create-listing");
            }}
            className={cn(
              "ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-all",
              view === "create-listing"
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground hover:border-primary/30",
            )}
          >
            <PlusSquare className="size-3.5" />
            Create
          </button>
        </nav>

        <div className="flex items-center gap-2">
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
                      ? "bg-muted/60 text-foreground"
                      : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  <div className="flex flex-col items-start">
                    <span>{item.label}</span>
                    <span className="text-[10px] text-muted-foreground/70">
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
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground",
              )}
            >
              <PlusSquare className="size-4" />
              <div className="flex flex-col items-start">
                <span>Create Listing</span>
                <span className="text-[10px] text-muted-foreground/70">
                  Publish new listing
                </span>
              </div>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
