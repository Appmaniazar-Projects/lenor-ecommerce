// Runs once when the Next.js server starts. Loads the Amrod catalogue in the
// background so the first visitor doesn't wait for the cold build.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const { getAllProducts } = await import("./lib/catalogue")

  // Deliberately not awaited: the server starts straight away.
  void getAllProducts().catch((error) => {
    console.error("Lenor: catalogue warm-up failed:", error)
  })
}