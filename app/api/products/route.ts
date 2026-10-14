import { NextResponse } from "next/server"
import {
  getAmrodProducts,
  getAmrodPrices,
  getAmrodStock,
} from "@/lib/amrod"

interface AmrodCategory {
  id: number
  name: string
  path: string
  code: string
  image: string
}

interface AmrodImage {
  name: string
  isDefault: boolean
  urls:
    | {
        url: string
        width: number
        height: number
      }[]
    | null
}

interface AmrodVariant {
  simpleCode: string
  fullCode: string
  codeColour: string | null
  codeColourName: string | null
  codeSize: string | null
  codeSizeName: string | null
}

interface AmrodBrandingTemplate {
  position: string
  name: string
  url: string
}

interface AmrodProduct {
  simpleCode: string
  fullCode: string
  productName: string
  description: string
  categories: AmrodCategory[] | null
  images: AmrodImage[] | null
  variants: AmrodVariant[] | null
  minimum: number
  introduced: string
  promotion: string
  brandingTemplates: AmrodBrandingTemplate[] | null
}

interface AmrodPrice {
  simplecode: string
  fullCode: string
  price: number
}

interface AmrodStock {
  simpleCode: string
  fullCode: string
  stockType: number
  colourCode: string | null
  stock: number
  reservedStock: number
  incomingStock: number | null
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number(code))
    )
    .replace(/\s+/g, " ")
    .trim()
}

function mapCategory(categoryName: string):
  | "apparel"
  | "bags"
  | "drinkware"
  | "tech"
  | "stationery"
  | "outdoor" {
  const category = categoryName.toLowerCase()

  if (
    category.includes("apparel") ||
    category.includes("clothing") ||
    category.includes("shirt") ||
    category.includes("headwear")
  ) {
    return "apparel"
  }

  if (
    category.includes("bag") ||
    category.includes("backpack") ||
    category.includes("luggage")
  ) {
    return "bags"
  }

  if (
    category.includes("drinkware") ||
    category.includes("mug") ||
    category.includes("bottle") ||
    category.includes("tumbler")
  ) {
    return "drinkware"
  }

  if (
    category.includes("tech") ||
    category.includes("technology") ||
    category.includes("usb") ||
    category.includes("power bank") ||
    category.includes("speaker")
  ) {
    return "tech"
  }

  if (
    category.includes("stationery") ||
    category.includes("writing") ||
    category.includes("notebook") ||
    category.includes("pen")
  ) {
    return "stationery"
  }

  return "outdoor"
}

function getStockLevel(stock: number) {
  if (stock <= 0) {
    return "out-of-stock" as const
  }

  if (stock <= 10) {
    return "low-stock" as const
  }

  return "in-stock" as const
}

export async function GET(request: Request) {
  try {

      const amrodStart = performance.now();
      const [products, prices, stock] = await Promise.all([
        getAmrodProducts<AmrodProduct[]>(),
        getAmrodPrices<AmrodPrice[]>(),
        getAmrodStock<AmrodStock[]>(),
      ]);

    console.log(
      `Lenor: Amrod requests took ${(
        performance.now() - amrodStart
      ).toFixed(2)} ms`
    );

    // Match prices by the actual sellable variant Full Code.
    const priceMap = new Map(
      (prices ?? []).map((item) => [
        item.fullCode,
        item.price,
      ])
    )

    // Match stock by variant Full Code.
    const stockMap = new Map<string, number>()

    for (const item of stock ?? []) {
      const existing = stockMap.get(item.fullCode) ?? 0

      stockMap.set(
        item.fullCode,
        existing + item.stock
      )
    }

    const normalizedProducts = (products ?? [])
      .map((product) => {
        const variants = product.variants ?? []

        const validVariants = variants.filter(
          (variant) => Boolean(variant.fullCode)
        )

        // A product without a valid variant cannot be matched
        // to Amrod pricing/stock.
        if (validVariants.length === 0) {
          return null
        }

        const primaryVariant = validVariants[0]

        // Preserve the individual Amrod variants so the
        // selected colour + size can later resolve to the
        // correct Full Code.
        const productVariants = validVariants.map(
          (variant) => ({
            fullCode: variant.fullCode,
            color:
              variant.codeColourName ??
              "Standard",
            size:
              variant.codeSizeName ??
              "One Size",
            price:
              priceMap.get(
                variant.fullCode
              ) ?? 0,
            stock:
              stockMap.get(
                variant.fullCode
              ) ?? 0,
          })
        )

        // Get prices for all variants belonging to this product.
        const variantPrices = productVariants
          .map((variant) => variant.price)
          .filter((price) => price > 0)

        // Get stock for all variants belonging to this product.
        const variantStock = productVariants.map(
          (variant) => variant.stock
        )

        // Use the lowest available variant price as the
        // starting/display price for the product.
        const price =
          variantPrices.length > 0
            ? Math.min(...variantPrices)
            : 0

        const totalStock = variantStock.reduce(
          (sum, value) => sum + value,
          0
        )

        // Collect available colour names.
        const colors = [
          ...new Set(
            validVariants
              .map(
                (variant) =>
                  variant.codeColourName
              )
              .filter(
                (value): value is string =>
                  Boolean(value)
              )
          ),
        ]

        // Collect available size names.
        const sizes = [
          ...new Set(
            validVariants
              .map(
                (variant) =>
                  variant.codeSizeName
              )
              .filter(
                (value): value is string =>
                  Boolean(value)
              )
          ),
        ]

        // Amrod images can be null and image URLs can also
        // be null for some products.
        const images = (product.images ?? [])
          .flatMap((image) =>
            (image.urls ?? []).map(
              (url) => url.url
            )
          )
          .filter(Boolean)

        // Branding templates can be null.
        const brandingPositions = (
          product.brandingTemplates ?? []
        ).map((template, index) => ({
          id: `bp-${product.simpleCode}-${index}`,
          label: template.name,
          description:
            `Branding template position ${template.position}`,
        }))

        const categoryName =
          product.categories?.[0]?.name ?? ""

        return {
          id: product.simpleCode,

          sku: primaryVariant.fullCode,

          name: product.productName,

          description: stripHtml(
            product.description ?? ""
          ),

          category: mapCategory(categoryName),

          price,

          images,

          colors:
            colors.length > 0
              ? colors
              : ["Standard"],

          sizes:
            sizes.length > 0
              ? sizes
              : ["One Size"],

          variants: productVariants,

          stockLevel:
            getStockLevel(totalStock),

          minOrderQty:
            product.minimum &&
            product.minimum > 0
              ? product.minimum
              : 1,

          brandingPositions,

          featured:
            product.promotion === "1",
        }
      })
      .filter(
        (
          product
        ): product is NonNullable<typeof product> =>
          product !== null
      )

    
    const searchParams = new URL(request.url).searchParams;

    // Preserve the existing array response for older callers.
    if (
      !searchParams.has("page") &&
      !searchParams.has("perPage")
    ) {
      return NextResponse.json(normalizedProducts);
    }

    let results = [...normalizedProducts];

    const search = searchParams.get("search")?.toLowerCase();
    const category = searchParams.get("category");
    const stockOnly = searchParams.get("stockOnly") === "true";
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");

    if (search) {
      results = results.filter(
        (product) =>
          product.name.toLowerCase().includes(search) ||
          product.description.toLowerCase().includes(search) ||
          product.sku.toLowerCase().includes(search)
      );
    }

    if (category) {
      results = results.filter(
        (product) => product.category === category
      );
    }

    if (minPriceParam !== null) {
      const minPrice = Number(minPriceParam);

      if (Number.isFinite(minPrice)) {
        results = results.filter(
          (product) => product.price >= minPrice
        );
      }
    }

    if (maxPriceParam !== null) {
      const maxPrice = Number(maxPriceParam);

      if (Number.isFinite(maxPrice)) {
        results = results.filter(
          (product) => product.price <= maxPrice
        );
      }
    }

    if (stockOnly) {
      results = results.filter(
        (product) => product.stockLevel !== "out-of-stock"
      );
    }

    const requestedPage = Number(searchParams.get("page") ?? "1");
    const requestedPerPage = Number(searchParams.get("perPage") ?? "12");

    const page = Number.isFinite(requestedPage)
      ? Math.max(1, Math.floor(requestedPage))
      : 1;

    const perPage = Number.isFinite(requestedPerPage)
      ? Math.min(100, Math.max(1, Math.floor(requestedPerPage)))
      : 12;

    const total = results.length;
    const totalPages = Math.ceil(total / perPage);
    const start = (page - 1) * perPage;

    return NextResponse.json({
      products: results.slice(start, start + perPage),
      total,
      page,
      totalPages,
    });

  } catch (error) {
    console.error(
      "Failed to fetch products from Amrod:",
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    )
  }
}