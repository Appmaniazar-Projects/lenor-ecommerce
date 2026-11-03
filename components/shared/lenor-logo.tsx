import { cn } from "@/lib/utils"

/**
 * The Lénor Branding logo (traced from the client's logo file).
 * `variant="light"` swaps the black lettering for yellow, for dark backgrounds.
 * Size it with a height class, e.g. className="h-10".
 */
export function LenorLogo({
  variant = "dark",
  className,
}: {
  variant?: "dark" | "light"
  className?: string
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={variant === "light" ? "/lenor-logo-light.svg" : "/lenor-logo.svg"}
      alt="Lénor Branding"
      width={608}
      height={269}
      className={cn("h-10 w-auto select-none", className)}
      draggable={false}
    />
  )
}
