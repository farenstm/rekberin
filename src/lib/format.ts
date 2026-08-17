// =====================================================================
// Format helpers
// =====================================================================

/** Format Rupiah */
export function formatIDR(value?: number): string {
  const num = typeof value === "number" && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/** Format POL dengan 4 desimal */
export function formatPOL(value?: number): string {
  const num = typeof value === "number" && !isNaN(value) ? value : 0;
  return `${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} POL`;
}

/** Legacy alias for formatPOL */
export const formatMATIC = formatPOL;

/** Format address: 0x45aB...6a78 */
export function shortenAddress(addr?: string, head = 6, tail = 4): string {
  if (!addr) return "";
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
}

/** Format tx hash: 0x8f3a...d1e2 */
export function shortenHash(hash?: string): string {
  if (!hash) return "";
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

/** Format timestamp ke relative time (Indonesian) */
export function timeAgo(timestamp?: number): string {
  if (!timestamp || isNaN(timestamp)) return "baru saja";
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
export function formatDate(timestamp?: number): string {
  if (!timestamp || isNaN(timestamp)) return "—";
  return new Date(timestamp).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
