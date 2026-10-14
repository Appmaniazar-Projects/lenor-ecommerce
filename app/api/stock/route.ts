import { NextResponse } from "next/server";
import { getAmrodStock } from "@/lib/amrod";

export async function GET() {
  try {
    const stock = await getAmrodStock();

    return NextResponse.json(stock);
  } catch (error) {
    console.error("Failed to fetch stock from Amrod:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}