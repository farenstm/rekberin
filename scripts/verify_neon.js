const { neon } = require("@neondatabase/serverless");

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_PXyoG4k2Mlug@ep-crimson-term-aehai3k1-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function verify() {
  const listings = await sql`SELECT id, game, title, price_matic, status FROM listings ORDER BY on_chain_id ASC`;
  const escrows = await sql`SELECT id, on_chain_id, listing_id, state, amount_matic FROM escrows ORDER BY on_chain_id ASC`;
  const events = await sql`SELECT count(*) FROM escrow_events`;

  console.log("=== DATA DI NEON POSTGRESQL ===");
  console.log(`\n📦 TOTAL LISTINGS (${listings.length}):`);
  console.table(listings);

  console.log(`\n🔒 TOTAL ESCROWS (${escrows.length}):`);
  console.table(escrows);

  console.log(`\n📜 TOTAL EVENTS DI DATABASE:`, events[0].count);
}

verify().catch(console.error);
