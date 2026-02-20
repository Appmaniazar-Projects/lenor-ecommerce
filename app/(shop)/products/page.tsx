import type { Metadata } from "next"
import { ProductCatalog } from "./product-catalog"

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse our full range of branded promotional products including apparel, bags, drinkware, tech accessories and more.",
}

export default function ProductsPage() {
  return <ProductCatalog />
}
