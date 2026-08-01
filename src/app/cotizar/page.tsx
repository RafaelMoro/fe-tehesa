import type { Metadata } from "next"

import { QuotePage } from "@/features/QuotePage/QuotePage"
import { QUOTE_DESCRIPTION, QUOTE_TITLE } from "@/shared/constants/seo.constants"

export const generateMetadata = (): Metadata => ({
  title: QUOTE_TITLE,
  description: QUOTE_DESCRIPTION,
  alternates: { canonical: "/cotizar" },
  robots: { index: false, follow: true },
})

export default function QuoteRoute() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <QuotePage />
    </main>
  )
}
