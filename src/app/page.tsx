"use client";

import { useEffect, useRef } from "react";
import { useAppStore, useListingsStore, useEscrowStore } from "@/lib/store";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { MetaMaskModal } from "@/components/metamask-modal";
import { HomeView } from "@/components/views/home-view";
import { MarketplaceView } from "@/components/views/marketplace-view";
import { ListingDetailView } from "@/components/views/listing-detail-view";
import { CreateListingView } from "@/components/views/create-listing-view";
import { EditListingView } from "@/components/views/edit-listing-view";
import { TransactionsView } from "@/components/views/transactions-view";
import { HowItWorksView } from "@/components/views/how-it-works-view";
import { AboutView } from "@/components/views/about-view";

export default function Home() {
  const view = useAppStore((s) => s.view);
  const syncListings = useListingsStore((s) => s.syncListings);
  const syncEscrows = useEscrowStore((s) => s.syncEscrows);
  const isSyncingListings = useListingsStore((s) => s.isSyncing);
  const isSyncingEscrows = useEscrowStore((s) => s.isSyncing);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!hasSynced.current) {
      hasSynced.current = true;
      syncListings().then(() => syncEscrows());
    }
  }, [syncListings, syncEscrows]);

  const isSyncing = isSyncingListings || isSyncingEscrows;

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {isSyncing && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/20 overflow-hidden">
          <div className="h-full bg-primary animate-pulse" style={{ width: "100%", animationDuration: "2s" }} />
        </div>
      )}
      <Navbar />
      <main className="flex-1">{renderView(view)}</main>
      <Footer />
      <MetaMaskModal />
    </div>
  );
}

function renderView(view: ReturnType<typeof useAppStore.getState>["view"]) {
  switch (view) {
    case "home":
      return <HomeView />;
    case "marketplace":
      return <MarketplaceView />;
    case "listing-detail":
      return <ListingDetailView />;
    case "create-listing":
      return <CreateListingView />;
    case "edit-listing":
      return <EditListingView />;
    case "transactions":
      return <TransactionsView />;
    case "how-it-works":
      return <HowItWorksView />;
    case "about":
      return <AboutView />;
    default:
      return <HomeView />;
  }
}
