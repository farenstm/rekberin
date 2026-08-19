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

// =====================================================================
// Wallet store — simulate MetaMask connection
// =====================================================================

interface WalletStore {
  wallet: WalletInfo;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const DEFAULT_WALLET: WalletInfo = {
  address: "",
  chainId: "0x13882",
  networkName: "Polygon Amoy Testnet",
  balanceMatic: 0,
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
            throw new Error("MetaMask / Web3 Wallet tidak ditemukan. Silakan install extension wallet di browser Anda.");
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
            if (!newAccounts || newAccounts.length === 0) {
              set((s) => ({ wallet: { ...s.wallet, status: "disconnected" } }));
            } else {
              try {
                const newBal = await provider.getBalance(newAccounts[0]);
                set((s) => ({
                  wallet: {
                    ...s.wallet,
                    address: newAccounts[0],
                    balanceMatic: Number(ethers.formatEther(newBal)),
                    status: "connected",
                  },
                }));
              } catch (err) {
                set((s) => ({
                  wallet: {
                    ...s.wallet,
                    address: newAccounts[0],
                    status: "connected",
                  },
                }));
              }
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
  setView: (v: ViewId) => void;
  setTransactionsTab: (t: TransactionsTab) => void;
  openListing: (id: string) => void;
  openEditListing: (id: string) => void;
  openTransaction: (id: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      view: "home",
      transactionsTab: "active",
      selectedListingId: null,
      editListingId: null,
      selectedTransactionId: null,
      setView: (v) => set({ view: v }),
      setTransactionsTab: (t) => set({ transactionsTab: t }),
      openListing: (id) =>
        set({ selectedListingId: id, view: "listing-detail" }),
      openEditListing: (id) =>
        set({ editListingId: id, view: "edit-listing" }),
      openTransaction: (id) => {
        const tx = useEscrowStore.getState().transactions.find((t) => t.id === id);
        const isActive = tx && (tx.state === "HELD" || tx.state === "REFUND_REQUESTED" || tx.state === "DEPOSITED");
        set({
          selectedTransactionId: id,
          view: "transactions",
          transactionsTab: isActive ? "active" : "history",
        });
      },
    }),
    {
      name: "escrowchain-app-state",
    }
  )
);

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
          
          const persistedListings = get().listings;
          const mergedListings = [...persistedListings];
          
          onChainListings.forEach((enriched) => {
            const index = mergedListings.findIndex((l) => l.id === enriched.id);
            if (index !== -1) {
              mergedListings[index] = enriched;
            } else {
              mergedListings.push(enriched);
            }
          });
          
          mergedListings.sort((a, b) => b.createdAt - a.createdAt);
          
          set({ listings: mergedListings, isSyncing: false });
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
  createEscrow: (listing: Listing, buyer: string, onChainId: number, txHash: string, blockNumber: number) => string;
  /** Buyer confirms receipt — HELD → RELEASED */
  confirmReceipt: (txId: string, txHash: string, blockNumber: number) => void;
  /** Legacy alias for confirmReceipt */
  confirmReceived: (txId: string, txHash: string, blockNumber: number) => void;
  /** Buyer requests refund — HELD → REFUND_REQUESTED (menunggu approval seller) */
  requestRefund: (txId: string, txHash: string, blockNumber: number) => void;
  /** Seller approves refund — REFUND_REQUESTED → REFUNDED */
  approveRefund: (txId: string, txHash: string, blockNumber: number) => void;
  /** Seller rejects refund — REFUND_REQUESTED → HELD (kembali ke hold) */
  rejectRefund: (txId: string, txHash: string, blockNumber: number) => void;
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
  txHash: string,
  blockNumber: number,
  data?: Record<string, string | number>,
): EscrowEventLog {
  return {
    id: `evt-${txId}-${event}-${Date.now()}`,
    event,
    txHash,
    blockNumber,
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
      createEscrow: (listing, buyer, onChainId, txHash, blockNumber) => {
        const id = `#${onChainId}`;
        const now = Date.now();
        const createdEvent = makeEvent(id, "EscrowCreated", buyer, txHash, blockNumber, {
          amount: `${listing.priceMatic} POL`,
          listingId: listing.id,
        });
        const depositEvent = makeEvent(id, "Deposited", buyer, txHash, blockNumber, {
          amount: `${listing.priceMatic} POL`,
        });
        const heldEvent = makeEvent(id, "Held", buyer, txHash, blockNumber, {
          amount: `${listing.priceMatic} POL`,
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
          holdTxHash: depositEvent.txHash,
          events: [createdEvent, depositEvent, heldEvent],
          buyerConfirmedReceipt: false,
          sellerConfirmedDelivery: true, // Auto true because no longer needed
        };
        useListingsStore.getState().updateListingStatus(listing.id, "LOCKED");
        set((s) => ({ transactions: [tx, ...s.transactions] }));
        return id;
      },
      confirmReceipt: (txId, txHash, blockNumber) => {
        set((s) => ({
          transactions: s.transactions.map((t) => {
            if (t.id !== txId) return t;
            if (t.state !== "HELD") return t;
            const evt = makeEvent(
              txId,
              "Released",
              t.buyer,
              txHash,
              blockNumber,
              { amount: `${t.amountMatic} POL`, buyer: t.buyer },
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
      confirmReceived: (txId, txHash, blockNumber) => {
        get().confirmReceipt(txId, txHash, blockNumber);
      },
      requestRefund: (txId, txHash, blockNumber) => {
        set((s) => ({
          transactions: s.transactions.map((t) => {
            if (t.id !== txId) return t;
            if (t.state !== "HELD") return t;
            const evt = makeEvent(
              txId,
              "RefundRequested",
              t.buyer,
              txHash,
              blockNumber,
              { amount: `${t.amountMatic} POL`, reason: "Buyer request refund" },
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
      approveRefund: (txId, txHash, blockNumber) => {
        set((s) => ({
          transactions: s.transactions.map((t) => {
            if (t.id !== txId) return t;
            if (t.state !== "REFUND_REQUESTED") return t;
            const approvedEvt = makeEvent(
              txId,
              "RefundApproved",
              t.seller,
              txHash,
              blockNumber,
              { seller: t.listing.sellerName },
            );
            const refundedEvt = makeEvent(
              txId,
              "Refunded",
              t.seller,
              txHash,
              blockNumber,
              { amount: `${t.amountMatic} POL`, to: t.buyer },
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
      rejectRefund: (txId, txHash, blockNumber) => {
        set((s) => ({
          transactions: s.transactions.map((t) => {
            if (t.id !== txId) return t;
            if (t.state !== "REFUND_REQUESTED") return t;
            const evt = makeEvent(
              txId,
              "RefundRejected",
              t.seller,
              txHash,
              blockNumber,
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
          
          const listings = useListingsStore.getState().listings;
          const persistedTransactions = get().transactions;
          
          const enrichedEscrows = onChainEscrows.map((e: any) => {
            const listing = listings.find((l) => l.id === e.listingId);

            const createTx: string | null = e._realCreateTx ?? null;
            const createBlock: number = e._realCreateBlock ?? 0;
            const stateTx: string | null = e._realStateTx ?? null;
            const stateBlock: number = e._realStateBlock ?? (createBlock + 10);

            const finalDepositTx = createTx;
            const finalHoldTx = createTx;
            let finalReleaseTx: string | null = null;
            let finalRefundTx: string | null = null;

            const finalEvents: ReturnType<typeof makeEvent>[] = [];

            if (createTx) {
              finalEvents.push(
                makeEvent(e.id, "EscrowCreated", e.buyer, createTx, createBlock, { amount: `${e.amountMatic} POL`, listingId: e.listingId }),
                makeEvent(e.id, "Deposited", e.buyer, createTx, createBlock, { amount: `${e.amountMatic} POL` }),
                makeEvent(e.id, "Held", e.buyer, createTx, createBlock, { amount: `${e.amountMatic} POL` })
              );
            }

            if (e.state === "RELEASED" && stateTx) {
              finalReleaseTx = stateTx;
              finalEvents.push(makeEvent(e.id, "Released", e.buyer, stateTx, stateBlock, { amount: `${e.amountMatic} POL`, buyer: e.buyer }));
            } else if (e.state === "REFUND_REQUESTED" && stateTx) {
              finalEvents.push(makeEvent(e.id, "RefundRequested", e.buyer, stateTx, stateBlock, { amount: `${e.amountMatic} POL`, reason: "Buyer request refund" }));
            } else if (e.state === "REFUNDED" && stateTx) {
              finalRefundTx = stateTx;
              finalEvents.push(
                makeEvent(e.id, "RefundRequested", e.buyer, stateTx, stateBlock, { amount: `${e.amountMatic} POL`, reason: "Buyer request refund" }),
                makeEvent(e.id, "RefundApproved", e.seller, stateTx, stateBlock + 5, { seller: e.seller }),
                makeEvent(e.id, "Refunded", e.seller, stateTx, stateBlock + 5, { amount: `${e.amountMatic} POL`, to: e.buyer })
              );
            }

            return {
              ...e,
              events: finalEvents,
              depositTxHash: finalDepositTx,
              holdTxHash: finalHoldTx,
              releaseTxHash: finalReleaseTx,
              refundTxHash: finalRefundTx,
              listing: listing || {
                id: e.listingId,
                title: "Unknown Listing",
                tier: "Standard",
                description: "Escrow transaction",
                features: [],
                game: "Unknown",
                priceMatic: e.amountMatic,
                priceIDR: e.amountIDR,
                seller: e.seller,
                sellerName: "Unknown",
                imageUrl: "",
                status: "SOLD",
              } as any,
            };
          });

          const mergedTransactions = [...persistedTransactions];
          
          enrichedEscrows.forEach((enriched: any) => {
            const index = mergedTransactions.findIndex((t) => t.id === enriched.id);
            if (index !== -1) {
              const localTx = mergedTransactions[index];
              mergedTransactions[index] = {
                ...(enriched as EscrowTransaction),
                events: enriched.events.length > 0 ? enriched.events : localTx.events,
                depositTxHash: enriched.depositTxHash || localTx.depositTxHash,
                holdTxHash: enriched.holdTxHash || localTx.holdTxHash,
                releaseTxHash: enriched.releaseTxHash || localTx.releaseTxHash,
                refundTxHash: enriched.refundTxHash || localTx.refundTxHash,
              };
            } else {
              mergedTransactions.push(enriched as EscrowTransaction);
            }
          });

          mergedTransactions.sort((a, b) => b.createdAt - a.createdAt);

          set({ transactions: mergedTransactions, isSyncing: false });
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
