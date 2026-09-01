import { neon } from "@neondatabase/serverless";

const defaultDbUrl =
  "postgresql://neondb_owner:npg_PXyoG4k2Mlug@ep-crimson-term-aehai3k1-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

const envUrl = process.env.DATABASE_URL?.trim();
const connectionString = (envUrl && envUrl.startsWith("postgres")) ? envUrl : defaultDbUrl;

let realSql: any = null;
try {
  realSql = neon(connectionString);
} catch (e) {
  console.warn("[AI Studio] Neon client initialization fallback:", e);
}

export const sql: any = async (strings: TemplateStringsArray, ...values: any[]) => {
  if (realSql) {
    try {
      return await realSql(strings, ...values);
    } catch (err: any) {
      console.warn("[AI Studio] Database query failed, using in-memory fallback:", err?.message || err);
    }
  }
  return [];
};

/**
 * Inisialisasi skema tabel di Neon Postgres
 */
export async function initDatabaseTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS listings (
      id VARCHAR(32) PRIMARY KEY,
      on_chain_id INTEGER UNIQUE,
      game VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      tier VARCHAR(100),
      description TEXT,
      price_idr NUMERIC,
      price_matic NUMERIC,
      image_url TEXT,
      seller_address VARCHAR(64) NOT NULL,
      seller_name VARCHAR(100),
      discord VARCHAR(100),
      telegram VARCHAR(100),
      whatsapp VARCHAR(100),
      cid TEXT NOT NULL,
      status VARCHAR(32) DEFAULT 'AVAILABLE',
      features JSONB DEFAULT '[]',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS escrows (
      id VARCHAR(32) PRIMARY KEY,
      on_chain_id INTEGER UNIQUE,
      listing_id VARCHAR(32) REFERENCES listings(id) ON DELETE SET NULL,
      buyer_address VARCHAR(64) NOT NULL,
      seller_address VARCHAR(64) NOT NULL,
      amount_matic NUMERIC NOT NULL,
      amount_idr NUMERIC,
      state VARCHAR(32) NOT NULL DEFAULT 'HELD',
      deposit_tx_hash VARCHAR(128),
      hold_tx_hash VARCHAR(128),
      release_tx_hash VARCHAR(128),
      refund_tx_hash VARCHAR(128),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS escrow_events (
      id VARCHAR(64) PRIMARY KEY,
      escrow_id VARCHAR(32) REFERENCES escrows(id) ON DELETE CASCADE,
      event_name VARCHAR(64) NOT NULL,
      tx_hash VARCHAR(128) NOT NULL,
      block_number BIGINT,
      from_address VARCHAR(64),
      data JSONB DEFAULT '{}',
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_profiles (
      address VARCHAR(64) PRIMARY KEY,
      name VARCHAR(100),
      avatar_url TEXT,
      bio TEXT,
      discord VARCHAR(100),
      telegram VARCHAR(100),
      whatsapp VARCHAR(100),
      reputation_score INTEGER DEFAULT 100,
      total_deals INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  return { success: true, message: "Tables initialized successfully" };
}