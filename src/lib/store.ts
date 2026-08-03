"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  EscrowState,
  EscrowTransaction,
  EscrowEvent,
  EscrowEventLog,
  Listing,
  ViewId,
  TransactionsTab,
  WalletInfo,
  WalletStatus,
} from "./types";
import {
  generateTxHash,
  generateBlockNumber,
  generateCID,
} from "./format";

// =====================================================================
// Wallet store — simulate MetaMask connection
// =====================================================================

interface WalletStore {
  wallet: WalletInfo;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const DEFAULT_WALLET: WalletInfo = {
  address: "0x45aB3cD2e1F40a5B6c7D8e9F0a1B2c3D4e5F6a78",
  chainId: "0x13882",
  networkName: "Polygon Amoy Testnet",
  balanceMatic: 1842.36,
  status: "disconnected",
};

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      wallet: DEFAULT_WALLET,
      connect: async () => {
        set((s) => ({ wallet: { ...s.wallet, status: "connecting" } }));
        try {
          if (typeof window === "undefined" || !window.ethereum) {
            throw new Error("No crypto wallet found");
          }
          const { switchNetworkToAmoy } = await import("./web3");
          await switchNetworkToAmoy();
          
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          const ethers = (await import("ethers")).ethers;
          const provider = new ethers.BrowserProvider(window.ethereum as any);
          const network = await provider.getNetwork();
          const balanceWei = await provider.getBalance(accounts[0]);
          
          // Listen for account changes to auto-sync!
          (window.ethereum as any).on("accountsChanged", async (newAccounts: string[]) => {
            if (newAccounts.length === 0) {
              set((s) => ({ wallet: { ...s.wallet, status: "disconnected" } }));
            } else {
              const newBal = await provider.getBalance(newAccounts[0]);
              set((s) => ({
                wallet: {
                  ...s.wallet,
                  address: newAccounts[0],
                  balanceMatic: Number(ethers.formatEther(newBal)),
                },
              }));
            }
          });
          
          set((s) => ({
            wallet: {
              address: accounts[0],
              chainId: "0x" + network.chainId.toString(16),
              networkName: network.name,
              balanceMatic: Number(ethers.formatEther(balanceWei)),
              status: "connected",
            },
          }));
        } catch (err) {
          console.error("Connection failed", err);
          set((s) => ({ wallet: { ...s.wallet, status: "error" } }));
        }
      },
      disconnect: () => {
        set((s) => ({ wallet: { ...s.wallet, status: "disconnected" } }));
      },
    }),
    {
      name: "escrowchain-wallet",
      partialize: (s) => ({ wallet: { ...s.wallet, status: "disconnected" } }),
    },
  ),
);

// =====================================================================
// App store — view navigation, current listing, current tx, modals
// =====================================================================

interface AppStore {
  view: ViewId;
  transactionsTab: TransactionsTab;
  selectedListingId: string | null;
  editListingId: string | null;
  selectedTransactionId: string | null;
  metamaskModal: {
    open: boolean;
    step: "review" | "pending" | "confirmed" | "rejected";
    title: string;
    description: string;
    action: string; // contract method name
    amountLabel: string; // e.g. "562.5 MATIC"
    onComplete?: () => void;
    onReject?: () => void;
  };
  setView: (v: ViewId) => void;
  setTransactionsTab: (t: TransactionsTab) => void;
  openListing: (id: string) => void;
  openEditListing: (id: string) => void;
  openTransaction: (id: string) => void;
  openMetaMask: (cfg: {
    title: string;
    description: string;
    action: string;
    amountLabel: string;
    imageUrl?: string;
    onComplete?: () => void;
    onReject?: () => void;
  }) => void;
  closeMetaMask: () => void;
  confirmMetaMask: () => void;
  rejectMetaMask: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  view: "home",
  transactionsTab: "active",
  selectedListingId: null,
  editListingId: null,
  selectedTransactionId: null,
  metamaskModal: {
    open: false,
    step: "review",
    title: "",
    description: "",
    action: "",
    amountLabel: "",
  },
  setView: (v) => set({ view: v }),
  setTransactionsTab: (t) => set({ transactionsTab: t }),
  openListing: (id) =>
    set({ selectedListingId: id, view: "listing-detail" }),
  openEditListing: (id) =>
    set({ editListingId: id, view: "edit-listing" }),
  openTransaction: (id) =>
    set({
      selectedTransactionId: id,
      view: "transactions",
      transactionsTab: "active",
    }),
  openMetaMask: (cfg) =>
    set({
      metamaskModal: {
        open: true,
        step: "review",
        title: cfg.title,
        description: cfg.description,
        action: cfg.action,
        amountLabel: cfg.amountLabel,
        onComplete: cfg.onComplete,
        onReject: cfg.onReject,
      },
    }),
  closeMetaMask: () =>
    set((s) => ({ metamaskModal: { ...s.metamaskModal, open: false } })),
  confirmMetaMask: async () => {
    set((s) => ({ metamaskModal: { ...s.metamaskModal, step: "pending" } }));
    await new Promise((r) => setTimeout(r, 1500));
    set((s) => ({ metamaskModal: { ...s.metamaskModal, step: "confirmed" } }));
    await new Promise((r) => setTimeout(r, 900));
    const onComplete = get().metamaskModal.onComplete;
    set((s) => ({ metamaskModal: { ...s.metamaskModal, open: false } }));
    onComplete?.();
  },
  rejectMetaMask: () => {
    const onReject = get().metamaskModal.onReject;
    set((s) => ({ metamaskModal: { ...s.metamaskModal, open: false } }));
    onReject?.();
  },
}));

// =====================================================================
// Listings store
// =====================================================================

interface ListingsStore {
  listings: Listing[];
  isSyncing: boolean;
  createListing: (data: Omit<Listing, "id" | "status" | "createdAt">, onChainId: number) => string;
  updateListingDetails: (id: string, updates: Partial<Listing>) => void;
  getById: (id: string) => Listing | undefined;
  updateListingStatus: (id: string, status: "AVAILABLE" | "LOCKED" | "SOLD" | "CANCELLED") => void;
  syncListings: () => Promise<void>;
}

export const useListingsStore = create<ListingsStore>()(
  persist(
    (set, get) => ({
      listings: [],
      isSyncing: false,
      createListing: (data, onChainId) => {
        const id = `L-${String(onChainId).padStart(3, "0")}`;
        const newListing: Listing = {
          ...data,
          id,
          cid: generateCID(),
          status: "AVAILABLE",
          createdAt: Date.now(),
        };
        set((s) => ({ listings: [newListing, ...s.listings] }));
        return id;
      },
      updateListingDetails: (id, updates) => {
        set((s) => ({
          listings: s.listings.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        }));
      },
      getById: (id) => get().listings.find((l) => l.id === id),
      updateListingStatus: (id, status) => {
        set((s) => ({
          listings: s.listings.map((l) =>
            l.id === id ? { ...l, status } : l
          ),
        }));
      },
      syncListings: async () => {
        set({ isSyncing: true });
        try {
          const { fetchAllListingsFromChain } = await import("./web3");
          const onChainListings = await fetchAllListingsFromChain();
          set({ listings: onChainListings, isSyncing: false });
        } catch (err) {
          console.error("Failed to sync listings", err);
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: "escrowchain-listings",
    }
  )
);

// =====================================================================
// Escrow store — FSM state machine
// =====================================================================
// Ini adalah inti dari skripsi. State transition rules:
//   NONE → HELD         (via createEscrow)
//   HELD → RELEASED     (via buyer confirmReceived)
//   HELD → REFUND_REQUESTED (via buyer requestRefund)
//   REFUND_REQUESTED → REFUNDED (via seller approveRefund)
// =====================================================================

interface EscrowStore {
  transactions: EscrowTransaction[];
  getById: (id: string) => EscrowTransaction | undefined;
  getActive: () => EscrowTransaction | undefined;
  getHistory: () => EscrowTransaction[];
  /** Buyer initiate purchase — NONE → HELD */
  createEscrow: (listing: Listing, buyer: string, onChainId: number) => string;
  /** Buyer confirms receipt — HELD → RELEASED */
  confirmReceived: (txId: string) => void;
  /** Buyer requests refund — HELD → REFUND_REQUESTED (menunggu approval seller) */
  requestRefund: (txId: string) => void;
  /** Seller approves refund — REFUND_REQUESTED → REFUNDED */
  approveRefund: (txId: string) => void;
  /** Seller rejects refund — REFUND_REQUESTED → HELD (kembali ke hold) */
  rejectRefund: (txId: string) => void;
  isSyncing: boolean;
  syncEscrows: () => Promise<void>;
}

function nextTxNumber(existing: EscrowTransaction[]): string {
  const nums = existing
    .map((t) => parseInt(t.id.replace("#", ""), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 11;
  return `#${max + 1}`;
}

function makeEvent(
  txId: string,
  event: EscrowEvent,
  from: string,
  data?: Record<string, string | number>,
): EscrowEventLog {
  return {
    id: `evt-${txId}-${event}-${Date.now()}`,
    event,
    txHash: generateTxHash(),
    blockNumber: generateBlockNumber(),
    from,
    timestamp: Date.now(),
    data,
  };
}

export const useEscrowStore = create<EscrowStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      isSyncing: false,
      getById: (id) => get().transactions.find((t) => t.id === id),
      getActive: () => {
        return get().transactions.find((t) => t.state === "HELD" || t.state === "REFUND_REQUESTED");
      },
      getHistory: () =>
        [...get().transactions].sort((a, b) => b.createdAt - a.createdAt),
  createEscrow: (listing, buyer, onChainId) => {
    const id = `#${onChainId}`;
    const now = Date.now();
    const createdEvent = makeEvent(id, "EscrowCreated", buyer, {
      amount: `${listing.priceMatic} MATIC`,
      listingId: listing.id,
    });
    const depositEvent = makeEvent(id, "Deposited", buyer, {
      amount: `${listing.priceMatic} MATIC`,
    });
    const tx: EscrowTransaction = {
      id,
      listingId: listing.id,
      listing,
      buyer,
      seller: listing.seller,
      amountMatic: listing.priceMatic,
      amountIDR: listing.priceIDR,
      state: "HELD",
      currentStateLabel: "HELD",
      createdAt: now,
      updatedAt: now,
      depositTxHash: depositEvent.txHash,
      events: [createdEvent, depositEvent],
      buyerConfirmedReceipt: false,
      sellerConfirmedDelivery: true, // Auto true because no longer needed
    };
    useListingsStore.getState().updateListingStatus(listing.id, "LOCKED");
    set((s) => ({ transactions: [tx, ...s.transactions] }));
    return id;
  },
  confirmReceived: (txId) => {
    set((s) => ({
      transactions: s.transactions.map((t) => {
        if (t.id !== txId) return t;
        if (t.state !== "HELD") return t;
        const evt = makeEvent(
          txId,
          "Released",
          t.buyer,
          { amount: `${t.amountMatic} MATIC`, buyer: t.buyer },
        );
        useListingsStore.getState().updateListingStatus(t.listingId, "SOLD");
        return {
          ...t,
          state: "RELEASED" as EscrowState,
          currentStateLabel: "RELEASED",
          buyerConfirmedReceipt: true,
          releaseTxHash: evt.txHash,
          updatedAt: Date.now(),
          events: [...t.events, evt],
        };
      }),
    }));
  },
  requestRefund: (txId) => {
    set((s) => ({
      transactions: s.transactions.map((t) => {
        if (t.id !== txId) return t;
        if (t.state !== "HELD") return t;
        const evt = makeEvent(
          txId,
          "RefundRequested",
          t.buyer,
          { amount: `${t.amountMatic} MATIC`, reason: "Buyer request refund" },
        );
        return {
          ...t,
          state: "REFUND_REQUESTED" as EscrowState,
          currentStateLabel: "REFUND_REQUESTED",
          updatedAt: Date.now(),
          events: [...t.events, evt],
        };
      }),
    }));
  },
  approveRefund: (txId) => {
    set((s) => ({
      transactions: s.transactions.map((t) => {
        if (t.id !== txId) return t;
        if (t.state !== "REFUND_REQUESTED") return t;
        const approvedEvt = makeEvent(
          txId,
          "RefundApproved",
          t.seller,
          { seller: t.listing.sellerName },
        );
        const refundedEvt = makeEvent(
          txId,
          "Refunded",
          t.seller,
          { amount: `${t.amountMatic} MATIC`, to: t.buyer },
        );
        useListingsStore.getState().updateListingStatus(t.listingId, "AVAILABLE");
        return {
          ...t,
          state: "REFUNDED" as EscrowState,
          currentStateLabel: "REFUNDED",
          refundTxHash: refundedEvt.txHash,
          updatedAt: Date.now(),
          events: [...t.events, approvedEvt, refundedEvt],
        };
      }),
    }));
  },
  rejectRefund: (txId) => {
    set((s) => ({
      transactions: s.transactions.map((t) => {
        if (t.id !== txId) return t;
        if (t.state !== "REFUND_REQUESTED") return t;
        const evt = makeEvent(
          txId,
          "RefundRejected",
          t.seller,
          { seller: t.listing.sellerName, reason: "Seller rejected refund" },
        );
        return {
          ...t,
          state: "HELD" as EscrowState,
          currentStateLabel: "HELD",
          updatedAt: Date.now(),
          events: [...t.events, evt],
        };
      }),
    }));
  },
  syncEscrows: async () => {
    set({ isSyncing: true });
    try {
      const { fetchAllEscrowsFromChain } = await import("./web3");
      const onChainEscrows = await fetchAllEscrowsFromChain();
      
      // Merge listing info into escrows
      const { useListingsStore } = await import("./store");
      
      // Force sync listings first so we always have the freshest metadata!
      await useListingsStore.getState().syncListings();
      
      const listings = useListingsStore.getState().listings;
      
      const enrichedEscrows = onChainEscrows.map((e: any) => {
        const listing = listings.find((l) => l.id === e.listingId);
        return {
          ...e,
          listing: listing || {
            id: e.listingId,
            title: "Unknown Listing",
            game: "Unknown",
            priceMatic: e.amountMatic,
            priceIDR: e.amountIDR,
            seller: e.seller,
            sellerName: "Unknown",
            imageUrl: "",
            status: "SOLD",
          } as any, // fallback
        };
      });
      
      set({ transactions: enrichedEscrows as EscrowTransaction[], isSyncing: false });
    } catch (err) {
      console.error("Failed to sync escrows", err);
      set({ isSyncing: false });
    }
  },
    }),
    {
      name: "escrowchain-transactions",
    }
  )
);
