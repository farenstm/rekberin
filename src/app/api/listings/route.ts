import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const game = searchParams.get("game");

    let query = sql`SELECT * FROM listings`;
    if (status && game) {
      query = sql`SELECT * FROM listings WHERE status = ${status} AND game ILIKE ${'%' + game + '%'} ORDER BY created_at DESC`;
    } else if (status) {
      query = sql`SELECT * FROM listings WHERE status = ${status} ORDER BY created_at DESC`;
    } else if (game) {
      query = sql`SELECT * FROM listings WHERE game ILIKE ${'%' + game + '%'} ORDER BY created_at DESC`;
    } else {
      query = sql`SELECT * FROM listings ORDER BY created_at DESC`;
    }

    const rows = await query;
    return NextResponse.json({ success: true, listings: rows });
  } catch (error: any) {
    console.error("Error fetching listings from Neon DB:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch listings" },
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
      game,
      title,
      tier,
      description,
      priceIDR,
      priceMatic,
      imageUrl,
      seller,
      sellerName,
      discord,
      telegram,
      whatsapp,
      cid,
      status,
      features,
    } = body;

    if (!id || !game || !title || !cid || !seller) {
      return NextResponse.json(
        { success: false, error: "Missing required listing fields" },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO listings (
        id, on_chain_id, game, title, tier, description, 
        price_idr, price_matic, image_url, seller_address, seller_name,
        discord, telegram, whatsapp, cid, status, features, updated_at
      ) VALUES (
        ${id}, ${onChainId || null}, ${game}, ${title}, ${tier || null}, ${description || null},
        ${priceIDR || 0}, ${priceMatic || 0}, ${imageUrl || null}, ${seller}, ${sellerName || null},
        ${discord || null}, ${telegram || null}, ${whatsapp || null}, ${cid}, ${status || "AVAILABLE"}, 
        ${JSON.stringify(features || [])}::jsonb, NOW()
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
        seller_name = EXCLUDED.seller_name,
        discord = EXCLUDED.discord,
        telegram = EXCLUDED.telegram,
        whatsapp = EXCLUDED.whatsapp,
        cid = EXCLUDED.cid,
        status = EXCLUDED.status,
        features = EXCLUDED.features,
        updated_at = NOW();
    `;

    return NextResponse.json({ success: true, message: "Listing saved to Neon DB" });
  } catch (error: any) {
    console.error("Error saving listing to Neon DB:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save listing" },
      { status: 500 }
    );
  }
}
