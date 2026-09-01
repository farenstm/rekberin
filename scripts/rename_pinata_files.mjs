import fs from "fs";
import path from "path";
import { ethers } from "ethers";

// Load .env
const envFile = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      if (val) process.env[key] = val;
    }
  }
}

const jwt = process.env.PINATA_JWT;
const apiKey = process.env.PINATA_API_KEY;
const apiSecret = process.env.PINATA_API_SECRET;

function getHeaders() {
  if (jwt) {
    return {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    };
  }
  return {
    pinata_api_key: apiKey,
    pinata_secret_api_key: apiSecret,
    "Content-Type": "application/json",
  };
}

async function fetchOnChainListings() {
  const cidMap = new Map();
  try {
    const contractInfoPath = path.resolve(process.cwd(), "src/lib/contract.ts");
    const contractContent = fs.readFileSync(contractInfoPath, "utf-8");
    const addrMatch = contractContent.match(/address:\s*"([^"]+)"/);
    const contractAddress = addrMatch ? addrMatch[1] : "0x1eCB0A2Ad4495a1B050B519b6ACe92B1e068Bf92";
    
    const abiPath = path.resolve(process.cwd(), "src/lib/abi.json");
    const contractAbi = JSON.parse(fs.readFileSync(abiPath, "utf-8"));
    
    const provider = new ethers.JsonRpcProvider("https://polygon-amoy.drpc.org");
    const contract = new ethers.Contract(contractAddress, contractAbi, provider);
    
    const nextId = await contract.nextListingId();
    console.log(`Smart Contract nextListingId: ${nextId}`);

    for (let i = 1; i < Number(nextId); i++) {
      try {
        const item = await contract.getListing(i);
        const cid = item.cid || "";
        if (cid) {
          cidMap.set(cid, {
            id: i,
            price: ethers.formatEther(item.price),
          });
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn("Could not query on-chain contract:", err.message);
  }
  return cidMap;
}

async function fetchFromGateways(cid) {
  const gateways = [
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`,
    `https://gateway.pinata.cloud/ipfs/${cid}`,
  ];

  for (const url of gateways) {
    try {
      const res = await fetch(url, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("json")) {
          const json = await res.json();
          return { type: "json", data: json };
        } else if (contentType.includes("image")) {
          return { type: "image", contentType };
        }
      }
    } catch (e) {}
  }
  return null;
}

async function run() {
  console.log("Starting Pinata batch renaming...");
  const headers = getHeaders();
  
  // 1. Fetch on-chain mapping
  const onChainMap = await fetchOnChainListings();
  console.log(`Found ${onChainMap.size} on-chain listing CIDs to map.`);

  // 2. Fetch list of pinned files from Pinata
  const listRes = await fetch("https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=100", {
    headers,
  });
  
  if (!listRes.ok) {
    console.error("Failed to list pins:", listRes.status, await listRes.text());
    return;
  }
  
  const data = await listRes.json();
  const rows = data.rows || [];
  console.log(`Found ${rows.length} pinned files on Pinata.\n`);

  let count = 0;
  for (let i = 0; i < rows.length; i++) {
    const pin = rows[i];
    const cid = pin.ipfs_pin_hash;
    const currentName = pin.metadata?.name || "unnamed";
    
    // Check if on-chain has this CID
    let newName = "";
    if (onChainMap.has(cid)) {
      const info = onChainMap.get(cid);
      newName = `listing-${info.id}.json`;
    }

    // If it's named data.json or needs renaming
    if (currentName === "data.json" || currentName.startsWith("listing-game") || !currentName.includes("listing-")) {
      console.log(`[${i + 1}/${rows.length}] Analyzing CID: ${cid} (Current: "${currentName}")`);
      
      const gatewayRes = await fetchFromGateways(cid);
      if (gatewayRes && gatewayRes.type === "json") {
        const json = gatewayRes.data;
        const gameSlug = (json.game || "game").toLowerCase().replace(/[^a-z0-9]/g, "-");
        const id = json.id ? String(json.id).replace(/\D/g, "") : (json.onChainId || "");
        if (id) {
          newName = `listing-${id}-${gameSlug}.json`;
        } else {
          newName = `listing-${gameSlug}-${cid.slice(0, 6)}.json`;
        }
      } else if (gatewayRes && gatewayRes.type === "image") {
        const ext = gatewayRes.contentType.split("/")[1] || "png";
        newName = `listing-cover-${cid.slice(0, 6)}.${ext}`;
      } else if (!newName && currentName === "data.json") {
        newName = `listing-metadata-${cid.slice(0, 6)}.json`;
      }

      if (newName && newName !== currentName) {
        console.log(`   -> ✏️ Renaming: "${currentName}" ➔ "${newName}"`);
        const updateRes = await fetch("https://api.pinata.cloud/pinning/hashMetadata", {
          method: "PUT",
          headers,
          body: JSON.stringify({
            ipfsPinHash: cid,
            name: newName,
          }),
        });

        if (updateRes.ok) {
          console.log(`   -> ✅ Sukses diubah ke: ${newName}`);
          count++;
        } else {
          console.log(`   -> ⚠️ Gagal:`, await updateRes.text());
        }
      }
    } else {
      console.log(`[${i + 1}/${rows.length}] ✅ Sudah rapi: "${currentName}" (${cid})`);
    }
  }

  console.log(`\n🎉 Selesai! Berhasil memperbarui ${count} nama file di Pinata.`);
}

run().catch(console.error);
