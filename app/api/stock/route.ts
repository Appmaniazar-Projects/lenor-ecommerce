import { NextResponse } from "next/server";
import { getAmrodStock } from "@/lib/amrod";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stock = await getAmrodStock();

    return NextResponse.json(stock);
  } catch (error) {
    console.error("Failed to fetch stock from Amrod:", error);

    return NextResponse.json(
      { error: "Stock is temporarily unavailable." },
      { status: 500 }
    );
  }
}