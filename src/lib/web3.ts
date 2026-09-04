import { ethers } from "ethers";
import { CONTRACT_INFO } from "./contract";
const abi = CONTRACT_INFO.abi;

export const CONTRACT_ADDRESS = CONTRACT_INFO.address;

export async function getProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No crypto wallet found. Please install it.");
  }
  return new ethers.BrowserProvider(window.ethereum as any);
}

export async function switchNetworkToAmoy() {
  if (typeof window === "undefined" || !window.ethereum) return;
  try {
    await (window.ethereum as any).request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x13882" }], // 80002 in hex
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await (window.ethereum as any).request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x13882",
              chainName: "Polygon Amoy Testnet",
              rpcUrls: ["https://polygon-amoy.drpc.org"],
              nativeCurrency: {
                name: "POL",
                symbol: "POL",
                decimals: 18,
              },
              blockExplorerUrls: ["https://amoy.polygonscan.com/"],
            },
          ],
        });
      } catch (addError) {
        console.error("Failed to add network:", addError);
      }
    }
  }
}

export async function getSigner() {
  const provider = await getProvider();
  return provider.getSigner();
}

export async function getContract() {
  await switchNetworkToAmoy();
  const signer = await getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
}

export async function getNextListingId(): Promise<number> {
  try {
    const provider = new ethers.JsonRpcProvider("https://polygon-amoy.drpc.org");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
    const nextId = await contract.nextListingId();
    return Number(nextId);
  } catch (e) {
    console.warn("Failed to query nextListingId on-chain, fallback to default", e);
    return 1;
  }
}

export async function createListingOnChain(priceMatic: number, cid: string) {
  const contract = await getContract();
  const priceWei = ethers.parseEther(priceMatic.toString());
  const tx = await contract.createListing(priceWei, cid);
  const receipt = await tx.wait();
  
  let listingId = 1;
  if (receipt && receipt.logs) {
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === "ListingCreated") {
          listingId = Number(parsed.args[0]);
          break;
        }
      } catch (e) {}
    }
  }
  return { receipt, listingId };
}

export async function updateListingOnChain(listingId: number, priceMatic: number, cid: string) {
  const contract = await getContract();
  const priceWei = ethers.parseEther(priceMatic.toString());
  const tx = await contract.updateListing(listingId, priceWei, cid);
  const receipt = await tx.wait();
  return receipt;
}

export async function cancelListingOnChain(listingId: number) {
  const contract = await getContract();
  const tx = await contract.cancelListing(listingId);
  const receipt = await tx.wait();
  return receipt;
}

export async function createEscrowOnChain(listingId: number, priceMatic: number) {
  await switchNetworkToAmoy();
  const signer = await getSigner();
  const priceWei = ethers.parseEther(priceMatic.toString());
  const buyerAddress = await signer.getAddress();
  const balanceWei = await signer.provider.getBalance(buyerAddress);

  if (balanceWei <= priceWei) {
    throw new Error(
      `Saldo tidak mencukupi. Harga listing ${ethers.formatEther(priceWei)} POL, ` +
      `sedangkan saldo Anda ${Number(ethers.formatEther(balanceWei)).toFixed(4)} POL. ` +
      "Tambahkan test POL untuk harga listing dan biaya gas.",
    );
  }

  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
  const tx = await contract.createEscrow(listingId, { value: priceWei });
  const receipt = await tx.wait();
  
  let escrowId = 1; // fallback
  if (receipt && receipt.logs) {
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === "EscrowCreated") {
          escrowId = Number(parsed.args[0]);
          break;
        }
      } catch (e) {
        // ignore
      }
    }
  }
  return { receipt, escrowId };
}

export async function confirmReceiptOnChain(txId: number) {
  const contract = await getContract();
  const tx = await contract.confirmReceipt(txId);
  const receipt = await tx.wait();
  return receipt;
}

export async function requestRefundOnChain(txId: number) {
  const contract = await getContract();
  const tx = await contract.requestRefund(txId);
  const receipt = await tx.wait();
  return receipt;
}

export async function approveRefundOnChain(txId: number) {
  const contract = await getContract();
  const tx = await contract.approveRefund(txId);
  const receipt = await tx.wait();
  return receipt;
}

export async function rejectRefundOnChain(txId: number) {
  const contract = await getContract();
  const tx = await contract.rejectRefund(txId);
  const receipt = await tx.wait();
  return receipt;
}

export async function fetchAllListingsFromChain() {
  const provider = new ethers.JsonRpcProvider("https://polygon-amoy-bor-rpc.publicnode.com");
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
  const nextId = await contract.nextListingId();
  const count = Number(nextId) - 1;
  const listings: any[] = [];

  let liveRate = 1660;
  try {
    const pRes = await fetch("/api/price");
    if (pRes.ok) {
      const pData = await pRes.json();
      if (pData?.polIdr) liveRate = pData.polIdr;
    }
  } catch (e) {}
  
  for (let i = 1; i <= count; i++) {
    try {
      const l = await contract.getListing(i);
      
      let metadata: any = {};
      try {
        let cid = l.cid.replace("ipfs://", "").trim();
        
        if (cid.startsWith("{")) {
          try {
            metadata = JSON.parse(cid);
          } catch (e) {}
        } else if (cid.startsWith("data:application/json;base64,")) {
          const base64Data = cid.replace("data:application/json;base64,", "");
          metadata = JSON.parse(decodeURIComponent(escape(atob(base64Data))));
        } else if (!cid.startsWith("Qm") && !cid.startsWith("bafy") && cid.length > 20 && !cid.includes("/")) {
          try {
            const decoded = decodeURIComponent(escape(atob(cid)));
            if (decoded.startsWith("{")) metadata = JSON.parse(decoded);
          } catch (e) {}
        }
        
        if (!metadata.title && !metadata.game && (cid.startsWith("Qm") || cid.startsWith("bafy"))) {
          try {
            const localRes = await fetch(`/api/ipfs/metadata?cid=${cid}`);
            if (localRes.ok) {
              const data = await localRes.json();
              if (data && (data.game || data.title || data.name)) {
                metadata = data;
              }
            }
          } catch (e) {}

          if (!metadata.title && !metadata.game) {
            const gateways = [
              `https://cloudflare-ipfs.com/ipfs/${cid}`,
              `https://dweb.link/ipfs/${cid}`,
              `https://ipfs.io/ipfs/${cid}`,
            ];
            
            try {
              metadata = await Promise.any(
                gateways.map(async (url) => {
                  const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
                  if (!res.ok) throw new Error("Gateway failed");
                  return await res.json();
                })
              );
            } catch (err) {
              // all gateways failed or timed out
            }
          }
        }
      } catch (e) {
        console.warn("Failed to fetch/parse metadata for listing", i, e);
      }
      
      const priceMatic = Number(ethers.formatEther(l.price));
      
      listings.push({
        id: `L-${String(i).padStart(3, "0")}`,
        game: metadata.game || "Unknown",
        title: metadata.title || "Unknown",
        tier: metadata.tier || "Unknown",
        description: metadata.description || "",
        priceIDR: Math.round(priceMatic * liveRate),
        priceMatic,
        imageUrl: metadata.image || "",
        seller: l.seller,
        sellerName: "Seller",
        discord: metadata.discord,
        telegram: metadata.telegram,
        whatsapp: metadata.whatsapp,
        cid: l.cid,
        status: l.isActive ? "AVAILABLE" : "SOLD",
        createdAt: Date.now(), // Fallback since on-chain doesn't store creation time for listing
        features: metadata.features || [],
      });
    } catch (e) {
      console.error(`Failed to fetch listing ${i}`, e);
    }
  }
  return listings.reverse(); // newest first
}

export async function fetchAllEscrowsFromChain() {
  const provider = new ethers.JsonRpcProvider("https://polygon-amoy-bor-rpc.publicnode.com");
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
  const nextId = await contract.nextEscrowId();
  const count = Number(nextId) - 1;
  const escrows: any[] = [];
  
  const STATE_MAP = ["HELD", "RELEASED", "REFUND_REQUESTED", "REFUNDED"];

  // Fetch real tx hashes from on-chain events (search last 300k blocks in chunks of 10k)
  const txMap: Record<string, { createTx?: string; createBlock?: number; stateTx?: string; stateBlock?: number }> = {};
  try {
    const currentBlock = await provider.getBlockNumber();
    for (let chunk = 0; chunk < 30; chunk++) {
      const to = currentBlock - chunk * 10000;
      const from = to - 10000;
      
      const createdEvents = await contract.queryFilter(contract.filters.EscrowCreated(), from, to);
      for (const ev of createdEvents) {
        const args = (ev as any).args;
        if (!args) continue;
        const id = `#${args[0].toString()}`;
        if (!txMap[id]) txMap[id] = {};
        txMap[id].createTx = ev.transactionHash;
        txMap[id].createBlock = ev.blockNumber;
      }

      const stateEvents = await contract.queryFilter(contract.filters.EscrowStateChanged(), from, to);
      for (const ev of stateEvents) {
        const args = (ev as any).args;
        if (!args) continue;
        const id = `#${args[0].toString()}`;
        if (!txMap[id]) txMap[id] = {};
        // Keep latest state change tx
        txMap[id].stateTx = ev.transactionHash;
        txMap[id].stateBlock = ev.blockNumber;
      }

      // Stop early if we found all escrows
      const foundAll = Array.from({ length: count }, (_, i) => `#${i + 1}`).every(id => txMap[id]?.createTx);
      if (foundAll) break;
    }
  } catch (err) {
    console.warn("Could not fetch on-chain event hashes:", err);
  }
  
  for (let i = 1; i <= count; i++) {
    try {
      const e = await contract.getEscrow(i);
      const state = STATE_MAP[Number(e.state)] as any;
      const amountMatic = Number(ethers.formatEther(e.amount));
      const realTx = txMap[`#${i}`] ?? {};
      
      escrows.push({
        id: `#${i}`,
        listingId: `L-${String(e.listingId).padStart(3, "0")}`,
        buyer: e.buyer,
        seller: e.seller,
        amountMatic,
        amountIDR: amountMatic * 6200,
        state,
        currentStateLabel: state,
        createdAt: Number(e.createdAt) * 1000,
        updatedAt: Number(e.updatedAt) * 1000,
        events: [],
        buyerConfirmedReceipt: state === "RELEASED",
        sellerConfirmedDelivery: true,
        depositTxHash: realTx.createTx ?? "",
        // Carry real event hashes for use in store enrichment
        _realCreateTx: realTx.createTx ?? null,
        _realCreateBlock: realTx.createBlock ?? null,
        _realStateTx: realTx.stateTx ?? null,
        _realStateBlock: realTx.stateBlock ?? null,
      });
    } catch (err) {
      console.error(`Failed to fetch escrow ${i}`, err);
    }
  }
  return escrows.reverse(); // newest first
}

