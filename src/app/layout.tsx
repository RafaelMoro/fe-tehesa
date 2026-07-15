import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { Providers } from "./providers"
import { ThemeProvider as NextThemesProvider } from "next-themes"

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
  title: "Tehesa | Suministro industrial",
  description:
    "Herramientas, tornillería y suministros industriales con entrega en todo México.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <NextThemesProvider attribute="class" defaultTheme="light">
            {children}
          </NextThemesProvider>
        </Providers>
      </body>
    </html>
  )
}
