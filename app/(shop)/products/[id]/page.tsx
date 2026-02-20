import type { Metadata } from "next"
import { getProduct } from "@/lib/api"
import { MOCK_PRODUCTS } from "@/lib/mock-data"
import { ProductDetailClient } from "./product-detail-client"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = MOCK_PRODUCTS.find((p) => p.id === id)
  return {
    title: product?.name ?? "Product Not Found",
    description: product?.description,
  }
}

export function generateStaticParams() {
  return MOCK_PRODUCTS.map((p) => ({ id: p.id }))
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()
  return <ProductDetailClient product={product} />
}
