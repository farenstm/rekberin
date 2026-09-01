import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    let query = sql`SELECT * FROM escrows ORDER BY created_at DESC`;
    if (address) {
      query = sql`
        SELECT * FROM escrows 
        WHERE LOWER(buyer_address) = LOWER(${address}) OR LOWER(seller_address) = LOWER(${address})
        ORDER BY created_at DESC
      `;
    }

    const escrows = await query;
    return NextResponse.json({ success: true, escrows });
  } catch (error: any) {
    console.error("Error fetching escrows from Neon DB:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch escrows" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      onChainId,
      listingId,
      buyer,
      seller,
      amountMatic,
      amountIDR,
      state,
      depositTxHash,
      holdTxHash,
      releaseTxHash,
      refundTxHash,
      events,
    } = body;

    if (!id || !buyer || !seller) {
      return NextResponse.json(
        { success: false, error: "Missing required escrow fields" },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO escrows (
        id, on_chain_id, listing_id, buyer_address, seller_address,
        amount_matic, amount_idr, state, deposit_tx_hash, hold_tx_hash,
        release_tx_hash, refund_tx_hash, updated_at
      ) VALUES (
        ${id}, ${onChainId || null}, ${listingId || null}, ${buyer}, ${seller},
        ${amountMatic || 0}, ${amountIDR || 0}, ${state || "HELD"}, ${depositTxHash || null}, ${holdTxHash || null},
        ${releaseTxHash || null}, ${refundTxHash || null}, NOW()
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

    // Upsert events if provided
    if (Array.isArray(events) && events.length > 0) {
      for (const ev of events) {
        if (ev.id && ev.txHash) {
          await sql`
            INSERT INTO escrow_events (
              id, escrow_id, event_name, tx_hash, block_number, from_address, data
            ) VALUES (
              ${ev.id}, ${id}, ${ev.event || ev.eventName}, ${ev.txHash}, 
              ${ev.blockNumber || null}, ${ev.from || null}, ${JSON.stringify(ev.data || {})}::jsonb
            )
            ON CONFLICT (id) DO NOTHING;
          `;
        }
      }
    }

    return NextResponse.json({ success: true, message: "Escrow saved to Neon DB" });
  } catch (error: any) {
    console.error("Error saving escrow to Neon DB:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save escrow" },
      { status: 500 }
    );
  }
}
