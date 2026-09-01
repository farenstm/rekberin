const { ethers } = require("ethers");
const { neon } = require("@neondatabase/serverless");

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_PXyoG4k2Mlug@ep-crimson-term-aehai3k1-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

const CONTRACT_ADDRESS = "0x1eCB0A2Ad4495a1B050B519b6ACe92B1e068Bf92";
const RPC_URL = "https://polygon-amoy-bor-rpc.publicnode.com";

const ABI = [
  "function nextListingId() view returns (uint256)",
  "function nextEscrowId() view returns (uint256)",
  "function getListing(uint256 _id) view returns (tuple(uint256 id, address payable seller, uint256 price, string cid, bool isActive))",
  "function getEscrow(uint256 _id) view returns (tuple(uint256 id, uint256 listingId, address payable buyer, address payable seller, uint256 amount, uint8 state, uint256 createdAt, uint256 updatedAt))",
  "event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 price, string cid)",
  "event ListingUpdated(uint256 indexed listingId, uint256 newPrice, string newCid)",
  "event ListingCancelled(uint256 indexed listingId)",
  "event EscrowCreated(uint256 indexed escrowId, uint256 indexed listingId, address indexed buyer, address seller, uint256 amount)",
  "event EscrowStateChanged(uint256 indexed escrowId, uint8 oldState, uint8 newState)"
];

const STATE_MAP = ["HELD", "RELEASED", "REFUND_REQUESTED", "REFUNDED"];

async function main() {
  console.log("🚀 Starting synchronization from Polygon Amoy to Neon PostgreSQL...\n");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  // 1. Sync Listings
  const nextListingId = await contract.nextListingId();
  const listingCount = Number(nextListingId) - 1;
  console.log(`📦 Found ${listingCount} listings on-chain.`);

  for (let i = 1; i <= listingCount; i++) {
    try {
      const l = await contract.getListing(i);
      const priceMatic = Number(ethers.formatEther(l.price));
      const priceIDR = priceMatic * 6200;
      const cid = l.cid.replace("ipfs://", "").trim();

      let metadata = {};
      if (cid.startsWith("{")) {
        try { metadata = JSON.parse(cid); } catch (e) {}
      } else if (cid.startsWith("data:application/json;base64,")) {
        try {
          const b64 = cid.replace("data:application/json;base64,", "");
          metadata = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
        } catch (e) {}
      } else if (!cid.startsWith("Qm") && !cid.startsWith("bafy") && cid.length > 20) {
        try {
          const decoded = Buffer.from(cid, "base64").toString("utf-8");
          if (decoded.startsWith("{")) metadata = JSON.parse(decoded);
        } catch (e) {}
      }

      if (!metadata.title && !metadata.game && (cid.startsWith("Qm") || cid.startsWith("bafy"))) {
        const gateways = [
          `https://gateway.pinata.cloud/ipfs/${cid}`,
          `https://cloudflare-ipfs.com/ipfs/${cid}`,
          `https://dweb.link/ipfs/${cid}`,
          `https://ipfs.io/ipfs/${cid}`
        ];
        for (const gw of gateways) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(gw, { signal: controller.signal });
            clearTimeout(timeout);
            if (res.ok) {
              metadata = await res.json();
              break;
            }
          } catch (err) {}
        }
      }

      const listingId = `L-${String(i).padStart(3, "0")}`;
      const game = metadata.game || "Game Account";
      const title = metadata.title || `Akun Game #${i}`;
      const tier = metadata.tier || "General";
      const description = metadata.description || "";
      const imageUrl = metadata.image || "";
      const status = l.isActive ? "AVAILABLE" : "SOLD";
      const features = JSON.stringify(metadata.features || []);

      await sql`
        INSERT INTO listings (
          id, on_chain_id, game, title, tier, description,
          price_idr, price_matic, image_url, seller_address, seller_name,
          discord, telegram, whatsapp, cid, status, features, updated_at
        ) VALUES (
          ${listingId}, ${i}, ${game}, ${title}, ${tier}, ${description},
          ${priceIDR}, ${priceMatic}, ${imageUrl}, ${l.seller}, ${metadata.sellerName || "Seller"},
          ${metadata.discord || null}, ${metadata.telegram || null}, ${metadata.whatsapp || null},
          ${l.cid}, ${status}, ${features}::jsonb, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          on_chain_id = EXCLUDED.on_chain_id,
          game = EXCLUDED.game,
          title = EXCLUDED.title,
          tier = EXCLUDED.tier,
          description = EXCLUDED.description,
          price_idr = EXCLUDED.price_idr,
          price_matic = EXCLUDED.price_matic,
          image_url = EXCLUDED.image_url,
          seller_address = EXCLUDED.seller_address,
          cid = EXCLUDED.cid,
          status = EXCLUDED.status,
          features = EXCLUDED.features,
          updated_at = NOW();
      `;

      console.log(`  ✓ Listing ${listingId} (${title}) -> Neon DB`);
    } catch (err) {
      console.error(`  ❌ Error syncing listing #${i}:`, err.message);
    }
  }

  // 2. Sync Events & Escrows
  const nextEscrowId = await contract.nextEscrowId();
  const escrowCount = Number(nextEscrowId) - 1;
  console.log(`\n🔒 Found ${escrowCount} escrows on-chain. Scanning events...`);

  const txMap = {};
  try {
    const currentBlock = await provider.getBlockNumber();
    for (let chunk = 0; chunk < 35; chunk++) {
      const to = currentBlock - chunk * 10000;
      const from = Math.max(0, to - 10000);
      
      const createdEvents = await contract.queryFilter(contract.filters.EscrowCreated(), from, to);
      for (const ev of createdEvents) {
        const id = `#${ev.args[0].toString()}`;
        if (!txMap[id]) txMap[id] = {};
        txMap[id].createTx = ev.transactionHash;
        txMap[id].createBlock = ev.blockNumber;
      }

      const stateEvents = await contract.queryFilter(contract.filters.EscrowStateChanged(), from, to);
      for (const ev of stateEvents) {
        const id = `#${ev.args[0].toString()}`;
        if (!txMap[id]) txMap[id] = {};
        txMap[id].stateTx = ev.transactionHash;
        txMap[id].stateBlock = ev.blockNumber;
      }

      const foundAll = Array.from({ length: escrowCount }, (_, idx) => `#${idx + 1}`).every(id => txMap[id]?.createTx);
      if (foundAll) break;
    }
  } catch (e) {
    console.warn("  ⚠️ Warning querying events:", e.message);
  }

  for (let i = 1; i <= escrowCount; i++) {
    try {
      const e = await contract.getEscrow(i);
      const id = `#${i}`;
      const listingId = `L-${String(e.listingId).padStart(3, "0")}`;
      const amountMatic = Number(ethers.formatEther(e.amount));
      const amountIDR = amountMatic * 6200;
      const state = STATE_MAP[Number(e.state)] || "HELD";

      const realTx = txMap[id] || {};
      const createTx = realTx.createTx || null;
      const stateTx = realTx.stateTx || null;

      let holdTx = createTx;
      let releaseTx = state === "RELEASED" ? stateTx : null;
      let refundTx = state === "REFUNDED" ? stateTx : null;

      await sql`
        INSERT INTO escrows (
          id, on_chain_id, listing_id, buyer_address, seller_address,
          amount_matic, amount_idr, state, deposit_tx_hash, hold_tx_hash,
          release_tx_hash, refund_tx_hash, updated_at
        ) VALUES (
          ${id}, ${i}, ${listingId}, ${e.buyer}, ${e.seller},
          ${amountMatic}, ${amountIDR}, ${state}, ${createTx}, ${holdTx},
          ${releaseTx}, ${refundTx}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          on_chain_id = EXCLUDED.on_chain_id,
          listing_id = EXCLUDED.listing_id,
          buyer_address = EXCLUDED.buyer_address,
          seller_address = EXCLUDED.seller_address,
          amount_matic = EXCLUDED.amount_matic,
          amount_idr = EXCLUDED.amount_idr,
          state = EXCLUDED.state,
          deposit_tx_hash = COALESCE(EXCLUDED.deposit_tx_hash, escrows.deposit_tx_hash),
          hold_tx_hash = COALESCE(EXCLUDED.hold_tx_hash, escrows.hold_tx_hash),
          release_tx_hash = COALESCE(EXCLUDED.release_tx_hash, escrows.release_tx_hash),
          refund_tx_hash = COALESCE(EXCLUDED.refund_tx_hash, escrows.refund_tx_hash),
          updated_at = NOW();
      `;

      // Insert events
      if (createTx) {
        await sql`
          INSERT INTO escrow_events (id, escrow_id, event_name, tx_hash, block_number, from_address, data)
          VALUES 
            (${`evt-${id}-created`}, ${id}, 'EscrowCreated', ${createTx}, ${realTx.createBlock || null}, ${e.buyer}, ${JSON.stringify({ amount: `${amountMatic} POL` })}::jsonb),
            (${`evt-${id}-deposited`}, ${id}, 'Deposited', ${createTx}, ${realTx.createBlock || null}, ${e.buyer}, ${JSON.stringify({ amount: `${amountMatic} POL` })}::jsonb),
            (${`evt-${id}-held`}, ${id}, 'Held', ${createTx}, ${realTx.createBlock || null}, ${e.buyer}, ${JSON.stringify({ amount: `${amountMatic} POL` })}::jsonb)
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      if (stateTx) {
        if (state === "RELEASED") {
          await sql`
            INSERT INTO escrow_events (id, escrow_id, event_name, tx_hash, block_number, from_address, data)
            VALUES (${`evt-${id}-released`}, ${id}, 'Released', ${stateTx}, ${realTx.stateBlock || null}, ${e.buyer}, ${JSON.stringify({ amount: `${amountMatic} POL` })}::jsonb)
            ON CONFLICT (id) DO NOTHING;
          `;
        } else if (state === "REFUND_REQUESTED") {
          await sql`
            INSERT INTO escrow_events (id, escrow_id, event_name, tx_hash, block_number, from_address, data)
            VALUES (${`evt-${id}-refundreq`}, ${id}, 'RefundRequested', ${stateTx}, ${realTx.stateBlock || null}, ${e.buyer}, ${JSON.stringify({ reason: 'Buyer request refund' })}::jsonb)
            ON CONFLICT (id) DO NOTHING;
          `;
        } else if (state === "REFUNDED") {
          await sql`
            INSERT INTO escrow_events (id, escrow_id, event_name, tx_hash, block_number, from_address, data)
            VALUES 
              (${`evt-${id}-refundapproved`}, ${id}, 'RefundApproved', ${stateTx}, ${realTx.stateBlock || null}, ${e.seller}, ${JSON.stringify({ seller: e.seller })}::jsonb),
              (${`evt-${id}-refunded`}, ${id}, 'Refunded', ${stateTx}, ${realTx.stateBlock || null}, ${e.seller}, ${JSON.stringify({ amount: `${amountMatic} POL` })}::jsonb)
            ON CONFLICT (id) DO NOTHING;
          `;
        }
      }

      console.log(`  ✓ Escrow ${id} (State: ${state}, Tx: ${createTx ? createTx.slice(0, 10) + '...' : 'none'}) -> Neon DB`);
    } catch (err) {
      console.error(`  ❌ Error syncing escrow #${i}:`, err.message);
    }
  }

  console.log("\n🎉 All previous on-chain listings and escrows have been successfully synced to Neon PostgreSQL!");
}

main().catch(console.error);
