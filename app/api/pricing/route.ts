import { NextResponse } from "next/server";
import { getAmrodPrices } from "@/lib/amrod";

export async function GET() {
  try {
    const pricing = await getAmrodPrices();

    return NextResponse.json(pricing);
  } catch (error) {
    console.error("Failed to fetch pricing from Amrod:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch pricing from Amrod",
      },
      { status: 500 }
    );
  }
}