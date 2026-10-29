"use client"

import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  describeMethod,
  methodsForColour,
  type BrandingChoice,
  type ProductBranding,
} from "@/lib/branding"
import { cn } from "@/lib/utils"

const NONE = "__none__"

interface BrandingSelectorProps {
  branding: ProductBranding
  /** Amrod colour code of the chosen variant, to hide excluded methods. */
  colourCode?: string | null
  branded: boolean
  onBrandedChange: (branded: boolean) => void
  choices: BrandingChoice[]
  onChoicesChange: (choices: BrandingChoice[]) => void
  /** Smaller layout for the quote basket. */
  compact?: boolean
  idPrefix?: string
}

/**
 * "Unbranded / Branded" switch, then a branding type per position,
 * like Amrod's own product page.
 */
export function BrandingSelector({
  branding,
  colourCode,
  branded,
  onBrandedChange,
  choices,
  onChoicesChange,
  compact = false,
  idPrefix = "branding",
}: BrandingSelectorProps) {
  function setMethod(positionCode: string, methodCode: string) {
    const position = branding.positions.find((p) => p.code === positionCode)
    const rest = choices.filter((c) => c.positionCode !== positionCode)

    if (!position || methodCode === NONE) {
      onChoicesChange(rest)
      return
    }

    const method = position.methods.find((m) => m.code === methodCode)
    if (!method) return

    // Keep the choices in the same order as the positions.
    const next = [
      ...rest,
      {
        positionCode: position.code,
        positionName: position.name,
        methodCode: method.code,
        methodName: method.name,
      },
    ].sort(
      (a, b) =>
        branding.positions.findIndex((p) => p.code === a.positionCode) -
        branding.positions.findIndex((p) => p.code === b.positionCode)
    )
    onChoicesChange(next)
  }

  return (
    <div className="flex flex-col gap-4">
      {!compact && (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Configure it personally for you
        </p>
      )}

      <div
        role="radiogroup"
        aria-label="Branding"
        className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1"
      >
        {[
          { label: "Unbranded", value: false },
          { label: "Branded", value: true },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={branded === option.value}
            onClick={() => onBrandedChange(option.value)}
            className={cn(
              "rounded-lg font-semibold transition-colors",
              compact ? "py-1.5 text-xs" : "py-2.5 text-sm",
              branded === option.value
                ? "bg-slate-500 text-white shadow-sm"
                : "text-foreground hover:bg-background"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {branded && (
        <div
          className={cn(
            "rounded-xl border border-border bg-background",
            compact ? "p-3" : "p-5"
          )}
        >
          {!compact && (
            <p className="border-b border-border pb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Branding details
            </p>
          )}

          {branding.positions.length === 0 ? (
            <p className="pt-3 text-sm text-muted-foreground">
              Amrod hasn&apos;t listed branding positions for this product.
              Describe what you need in the quote notes and Lenor will advise.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {branding.positions.map((position) => {
                const methods = methodsForColour(position, colourCode)
                const chosen = choices.find((c) => c.positionCode === position.code)
                const chosenStillValid = chosen && methods.some((m) => m.code === chosen.methodCode)
                const selectId = `${idPrefix}-${position.code}`

                return (
                  <div key={position.code} className={compact ? "py-2.5" : "py-4"}>
                    <p className="text-sm font-medium text-blue-600">
                      {position.name}
                      {position.required && (
                        <span className="ml-2 text-xs font-normal text-amber-700">
                          Required when branded
                        </span>
                      )}
                    </p>
                    {position.description && (
                      <p className="text-xs text-muted-foreground">{position.description}</p>
                    )}
                    {position.multiplier > 1 && (
                      <p className="text-xs text-muted-foreground">
                        Can be branded in {position.multiplier} places. Say where in your notes.
                      </p>
                    )}

                    <label
                      htmlFor={selectId}
                      className="mt-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Branding type
                    </label>

                    {position.methods.length === 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Branding type confirmed in your quotation.
                      </p>
                    ) : methods.length === 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Not available on this colour.
                      </p>
                    ) : (
                      <Select
                        value={chosenStillValid ? chosen.methodCode : NONE}
                        onValueChange={(value) => setMethod(position.code, value)}
                      >
                        <SelectTrigger id={selectId} className="mt-1 w-full">
                          <SelectValue placeholder="-Select-" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>-Select-</SelectItem>
                          {methods.map((method) => (
                            <SelectItem key={method.code} value={method.code}>
                              {describeMethod(method)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {branding.fixedPositions.length > 0 && (
            <p className={cn("text-xs text-muted-foreground", compact ? "pt-2" : "pt-3")}>
              {branding.fixedPositions.join(", ")}{" "}
              {branding.fixedPositions.length === 1 ? "carries" : "carry"} a fixed
              Amrod design and can&apos;t take your logo.
            </p>
          )}

          {branding.guideUrl && (
            <Button
              asChild
              type="button"
              variant="outline"
              size="sm"
              className={cn("rounded-full", compact ? "mt-2" : "mt-4")}
            >
              <a href={branding.guideUrl} target="_blank" rel="noopener noreferrer">
                View Branding Guidelines
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Checks a branded selection. Returns an error message, or null when OK.
 * Choices whose method no longer exists for the colour are ignored.
 */
export function brandingProblem(
  branding: ProductBranding,
  colourCode: string | null | undefined,
  branded: boolean,
  choices: BrandingChoice[]
): string | null {
  if (!branded) return null

  const selectable = branding.positions.filter(
    (p) => methodsForColour(p, colourCode).length > 0
  )
  // Nothing to pick from Amrod: Lenor confirms branding in the quote.
  if (selectable.length === 0) return null

  const valid = validChoices(branding, colourCode, choices)
  if (valid.length === 0) return "Choose a branding type for at least one position."

  const missing = selectable.filter(
    (p) => p.required && !valid.some((c) => c.positionCode === p.code)
  )
  if (missing.length > 0) {
    return `Choose a branding type for ${missing.map((p) => p.name).join(", ")}.`
  }
  return null
}

export function validChoices(
  branding: ProductBranding,
  colourCode: string | null | undefined,
  choices: BrandingChoice[]
): BrandingChoice[] {
  return choices.filter((c) => {
    const position = branding.positions.find((p) => p.code === c.positionCode)
    return position && methodsForColour(position, colourCode).some((m) => m.code === c.methodCode)
  })
}
