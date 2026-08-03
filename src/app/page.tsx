"use client";

import { useAppStore } from "@/lib/store";
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
