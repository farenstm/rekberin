// =====================================================================
// Format helpers
// =====================================================================

/** Format Rupiah */
export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format MATIC dengan 4 desimal */
export function formatMATIC(value: number): string {
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} MATIC`;
}

/** Format address: 0x45aB...6a78 */
export function shortenAddress(addr: string, head = 6, tail = 4): string {
  if (!addr) return "";
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
}

/** Format tx hash: 0x8f3a...d1e2 */
export function shortenHash(hash: string): string {
  if (!hash) return "";
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

/** Format timestamp ke relative time (Indonesian) */
export function timeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if (day > 0) return `${day} hari lalu`;
  if (hour > 0) return `${hour} jam lalu`;
  if (min > 0) return `${min} menit lalu`;
  if (sec > 0) return `${sec} detik lalu`;
  return "baru saja";
}

/** Format timestamp ke tanggal lengkap */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Generate random tx hash (untuk simulasi) */
export function generateTxHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

/** Generate random block number */
export function generateBlockNumber(): number {
  return 6_480_000 + Math.floor(Math.random() * 10_000);
}

/** Generate random IPFS-like CID */
export function generateCID(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let cid = "bafybei";
  for (let i = 0; i < 52; i++) {
    cid += chars[Math.floor(Math.random() * chars.length)];
  }
  return cid;
}
