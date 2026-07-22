import { ethers } from "ethers";
import abi from "./abi.json";

export const CONTRACT_ADDRESS = "0xe31BE7F102BEbe58f64FA01fd7aF1f8065c8efde";

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
                name: "MATIC",
                symbol: "MATIC",
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

export async function createEscrowOnChain(listingId: number, priceMatic: number) {
  const contract = await getContract();
  const priceWei = ethers.parseEther(priceMatic.toString());
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
