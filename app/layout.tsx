import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { CartProvider } from '@/contexts/cart-context'
import { QuoteProvider } from '@/contexts/quote-context'
import { AuthProvider } from '@/contexts/auth-context'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'Lenor | Your Branded Merchandise Partner',
    template: '%s | Lenor',
  },
  description:
    'Lenor is South Africa\'s trusted B2B supplier of branded promotional products. Request a quote for apparel, bags, drinkware, tech accessories and more.',
  keywords: [
    'promotional products',
    'branded merchandise',
    'corporate gifts',
    'South Africa',
    'B2B',
    'branding',
  ],
}

export const viewport: Viewport = {
  themeColor: '#1a1d2b',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <CartProvider>
            <QuoteProvider>
              {children}
              <Toaster richColors position="bottom-right" />
            </QuoteProvider>
          </CartProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
