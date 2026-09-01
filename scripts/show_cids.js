const { neon } = require("@neondatabase/serverless");

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_PXyoG4k2Mlug@ep-crimson-term-aehai3k1-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function showCIDs() {
  const rows = await sql`SELECT id, on_chain_id, title, cid, image_url FROM listings ORDER BY on_chain_id ASC`;
  console.log("=== DAFTAR LENGKAP IPFS CID DI DATABASE NEON & SMART CONTRACT ===");
  rows.forEach((r) => {
    console.log(`\n🔹 Listing: ${r.id} (#${r.on_chain_id}) - ${r.title}`);
    console.log(`   IPFS CID : ${r.cid}`);
    if (r.image_url) console.log(`   Image URL: ${r.image_url}`);
  });
}

showCIDs().catch(console.error);
