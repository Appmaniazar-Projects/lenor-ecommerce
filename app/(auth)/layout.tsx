import Link from "next/link"
import { SITE_NAME } from "@/lib/constants"
import { LenorLogo } from "@/components/shared/lenor-logo"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Link href="/" className="mb-8" aria-label={`${SITE_NAME} home`}>
        <LenorLogo className="h-16" />
      </Link>
      {children}
    </div>
  )
}
