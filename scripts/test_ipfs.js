require('dotenv').config();
const { ethers } = require("ethers");
const fs = require('fs');

async function main() {
  const provider = new ethers.JsonRpcProvider("https://polygon-amoy-bor-rpc.publicnode.com");
  const abi = JSON.parse(fs.readFileSync('src/lib/abi.json', 'utf8'));
  const address = '0x1eCB0A2Ad4495a1B050B519b6ACe92B1e068Bf92';
  
  const contract = new ethers.Contract(address, abi, provider);
  const nextId = await contract.nextListingId();
  console.log("Next Listing ID:", nextId.toString());
  
  const count = Number(nextId) - 1;
  if (count < 1) {
    console.log("No listings yet.");
    return;
  }
  
  const l = await contract.getListing(count);
  console.log("Listing from chain:", l);
  console.log("CID:", l.cid);
  
  const cid = l.cid.replace("ipfs://", "");
  console.log("Clean CID:", cid);
  
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`
  ];
  
  for (const url of gateways) {
    console.log(`\nTrying: ${url}`);
    try {
      const res = await fetch(url);
      console.log(`Status: ${res.status} ${res.statusText}`);
      if (res.ok) {
        const text = await res.text();
        console.log(`Body: ${text.substring(0, 100)}...`);
      }
    } catch (err) {
      console.error(`Error fetching ${url}:`, err.message);
    }
  }
}

main().catch(console.error);
