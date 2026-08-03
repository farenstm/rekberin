// =====================================================================
// EscrowChain — Core Domain Types
// =====================================================================
// Semua type di sini adalah kontrak antara UI, store, dan smart contract
// simulation. Pensil thesis mengikuti struktur ini.
// =====================================================================

/** Status dari sebuah listing di marketplace */
export type ListingStatus = "AVAILABLE" | "LOCKED" | "SOLD";

/**
 * State mesin escrow (FSM).
 *
 *   NONE ──deposit──▶ DEPOSITED ──hold──▶ HELD ──release──▶ RELEASED
 *                                            │
 *                                            └──refundReq──▶ REFUND_REQUESTED
 *                                                                  │
 *                                            ┌──approveRefund───┘
 *                                            │
 *                                            ▼
 *                                         REFUNDED
 *                                                                  │
 *                                            ┌──rejectRefund────┘
 *                                            │
 *                                            ▼
 *                                          HELD (kembali)
 *
 * Semua transisi dicatat ke on-chain event log.
 */
export type EscrowState =
  | "NONE"              // Belum ada escrow dibuat
  | "DEPOSITED"         // Buyer sudah deposit, menunggu konfirmasi hold
  | "HELD"              // Dana ditahan smart contract, menunggu release / refund request
  | "REFUND_REQUESTED"  // Buyer minta refund, menunggu approval seller
  | "RELEASED"          // Dana dilepas ke seller — transaksi selesai sukses
  | "REFUNDED"          // Dana dikembalikan ke buyer — refund disetujui seller
  | "DISPUTED";         // Sengketa — admin / arbitrator harus intervensi

/** Jenis event yang dipancarkan smart contract */
export type EscrowEvent =
  | "ListingCreated"
  | "EscrowCreated"
  | "Deposited"
  | "Held"
  | "Released"
  | "RefundRequested"
  | "RefundApproved"
  | "RefundRejected"
  | "Refunded"
  | "DisputeOpened";

/** Listing digital item — game account, etc. */
export interface Listing {
  id: string;                // Listing ID (mis. L-001)
  game: string;              // Nama game (mis. Mobile Legends)
  title: string;             // Judul listing
  tier: string;              // Tier rank (mis. Epic, Diamond)
  description: string;       // Deskripsi akun
  priceIDR: number;          // Harga dalam Rupiah
  priceMatic: number;        // Harga ekuivalen dalam MATIC
  imageUrl?: string;         // URL IPFS gambar (contoh: ipfs://Qm...)
  seller: string;            // Wallet seller (0x...)
  sellerName: string;        // Nama seller
  discord?: string;          // Discord seller
  telegram?: string;         // Telegram seller
  whatsapp?: string;         // WhatsApp seller
  cid: string;               // IPFS CID untuk metadata listing
  status: ListingStatus;     // Status saat ini
  createdAt: number;         // Timestamp unix
  features: string[];        // Highlight fitur (mis. "100 Hero", "Mythic Badge")
}

/**
 * Transaksi escrow. Setiap transaksi punya FSM state machine.
 * Inilah inti penelitian skripsi.
 */
export interface EscrowTransaction {
  id: string;                       // TX ID (mis. #15)
  listingId: string;                // Listing reference
  listing: Listing;                 // Snapshot listing
  buyer: string;                    // Wallet buyer
  seller: string;                   // Wallet seller (sama dengan listing.seller)
  amountMatic: number;              // Jumlah yang di-escrow
  amountIDR: number;                // Jumlah ekuivalen IDR
  state: EscrowState;               // State FSM saat ini
  currentStateLabel: string;        // Label untuk UI (mis. "HELD")
  createdAt: number;                // Waktu escrow dibuat
  updatedAt: number;                // Waktu update terakhir
  depositTxHash: string;            // Hash tx deposit on-chain
  holdTxHash?: string;              // Hash tx hold
  releaseTxHash?: string;           // Hash tx release
  refundTxHash?: string;            // Hash tx refund
  events: EscrowEventLog[];         // Event log lengkap
  buyerConfirmedReceipt?: boolean;  // Buyer sudah konfirmasi terima akun
  sellerConfirmedDelivery?: boolean;// Seller sudah konfirmasi kirim akun
}

/** Event log entry — merepresentasikan event yang dipancarkan smart contract */
export interface EscrowEventLog {
  id: string;
  event: EscrowEvent;
  txHash: string;
  blockNumber: number;
  from: string;
  timestamp: number;
  data?: Record<string, string | number>;
}

/** View identifier untuk SPA navigation */
export type ViewId =
  | "home"
  | "marketplace"
  | "listing-detail"
  | "create-listing"
  | "edit-listing"
  | "transactions"
  | "how-it-works"
  | "about";

/** Sub-tab di dalam Transactions view */
export type TransactionsTab = "active" | "history" | "contract-status" | "contract-source";

/** Status koneksi wallet */
export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

/** Info wallet yang terkoneksi */
export interface WalletInfo {
  address: string;
  chainId: string;
  networkName: string;
  balanceMatic: number;
  status: WalletStatus;
}

/** Smart contract info (read-only display) */
export interface ContractInfo {
  name: string;
  address: string;
  network: string;
  chainId: string;
  deployBlock: number;
  abi: Array<{
    name: string;
    type: "function" | "event";
    inputs: Array<{ name: string; type: string }>;
    outputs?: Array<{ name: string; type: string }>;
    stateMutability?: string;
  }>;
  sourceCode: string;
}
