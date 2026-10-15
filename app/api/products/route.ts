import { NextResponse } from "next/server"
import {
  getAllProducts,
  queryCatalogue,
  type CatalogueQuery,
} from "@/lib/catalogue"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Legacy callers: no paging params means the full array.
    if (!searchParams.has("page") && !searchParams.has("perPage")) {
      return NextResponse.json(await getAllProducts())
    }

    const num = (key: string) => {
      const value = searchParams.get(key)
      if (value === null || value.trim() === "") return undefined
      const n = Number(value)
      return Number.isFinite(n) ? n : undefined
    }

    // Repeat the param for multiple values: ?brand=Altitude&brand=Cutter
    const many = (key: string) =>
      searchParams.getAll(key).map((v) => v.trim()).filter(Boolean)

    const sort = searchParams.get("sort")

    const query: CatalogueQuery = {
      search: searchParams.get("search") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      brands: many("brand"),
      genders: many("gender"),
      colours: many("colour"),
      sizes: many("size"),
      materials: many("material"),
      fits: many("fit"),
      minPrice: num("minPrice"),
      maxPrice: num("maxPrice"),
      minStock: num("minStock"),
      stockOnly: searchParams.get("stockOnly") === "true",
      promotionOnly: searchParams.get("promotion") === "true",
      featured: searchParams.get("featured") === "true",
      sort:
        sort === "price-asc" ||
        sort === "price-desc" ||
        sort === "name-asc" ||
        sort === "newest"
          ? sort
          : undefined,
      page: num("page"),
      perPage: num("perPage"),
    }

    return NextResponse.json(await queryCatalogue(query))
  } catch (error) {
    console.error("Failed to load products from Amrod:", error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
