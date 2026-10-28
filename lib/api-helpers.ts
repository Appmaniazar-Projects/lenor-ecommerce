import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { AmrodNoContentError } from "@/lib/amrod"
import { OrderValidationError } from "@/lib/orders"

/** Turns known failures into clear JSON errors instead of a generic 500. */
export function errorResponse(error: unknown) {
  if (error instanceof OrderValidationError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Some details are missing or invalid.",
        fields: error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    )
  }

  if (error instanceof AmrodNoContentError) {
    // Amrod is offline between 00:00 and 01:00 (GMT+2).
    return NextResponse.json(
      { error: "The catalogue is updating. Please try again in a few minutes." },
      { status: 503, headers: { "Retry-After": "300" } }
    )
  }

  console.error("Lenor API error:", error)
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  )
}
