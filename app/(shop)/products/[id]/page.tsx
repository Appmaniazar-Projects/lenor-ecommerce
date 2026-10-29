import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductById } from "@/lib/catalogue"
import { forViewer } from "@/lib/pricing-visibility"
import { ProductDetailClient } from "./product-detail-client"


// Amrod can take a while on a fresh server; give it time.
export const maxDuration = 60

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = await getProductById(id)

  return {
    title: product?.name ?? "Product Not Found",
    description: product?.description,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const product = await getProductById(id)

  if (!product) notFound()

  return <ProductDetailClient product={await forViewer(product)} />
}
