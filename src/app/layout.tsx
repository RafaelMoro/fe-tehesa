import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { Providers } from "./providers"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { Header } from "@/shared/ui/organisms/Header"
import { fetchBrands, fetchCategories } from "@/shared/lib/global.lib"
import type { TaxonomyItem } from "@/shared/types/global.types"
import {
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/shared/constants/seo.constants"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
}

// The header fetches taxonomy per request and reads useSearchParams, so every
// route must stay dynamic (this replaces the getThemePreference() cookie read
// that previously forced dynamic rendering).
export const dynamic = "force-dynamic"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let categories: TaxonomyItem[] = []
  let brands: TaxonomyItem[] = []
  try {
    // ponytail: duplicates page.tsx's taxonomy query on /; React.cache() module if it shows in Strapi logs.
    ;[categories, brands] = await Promise.all([fetchCategories(), fetchBrands()])
  } catch (error) {
    console.warn(
      "layout: failed to fetch category/brand taxonomy, rendering header without dropdown items",
      error,
    )
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <NextThemesProvider attribute="class" defaultTheme="light">
            <Header categories={categories} brands={brands} />
            {children}
          </NextThemesProvider>
        </Providers>
      </body>
    </html>
  )
}
