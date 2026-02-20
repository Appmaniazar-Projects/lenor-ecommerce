import { Search, FileText, MessageSquare, Truck } from "lucide-react"

const steps = [
  {
    icon: Search,
    title: "Browse Products",
    description:
      "Explore our extensive catalog of quality promotional products across apparel, bags, drinkware, tech and more.",
  },
  {
    icon: FileText,
    title: "Build Your Quote",
    description:
      "Select items, specify quantities, choose branding positions and upload your logo. Add everything to your quote basket.",
  },
  {
    icon: MessageSquare,
    title: "Get a Formal Quote",
    description:
      "Submit your quote request. Our team reviews your requirements and responds with a detailed quotation within 24 hours.",
  },
  {
    icon: Truck,
    title: "Approve & Receive",
    description:
      "Approve artwork proofs, confirm your order, and we handle production and delivery right to your door.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-muted/30 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            From browsing to delivery, our streamlined process makes ordering
            branded merchandise simple and hassle-free.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
                  <Icon className="h-6 w-6 text-accent" />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
