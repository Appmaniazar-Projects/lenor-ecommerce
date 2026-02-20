import Link from "next/link"
import { SITE_NAME } from "@/lib/constants"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
          <span className="text-lg font-bold text-primary-foreground">L</span>
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">
          {SITE_NAME}
        </span>
      </Link>
      {children}
    </div>
  )
}
