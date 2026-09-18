import Link from "next/link"
import { RiArrowRightLine } from "@remixicon/react"

import {
  BRAND_PAGE_HREFS,
  BRAND_PAGES,
  getBrandDisplayName,
} from "@/shared/constants/brand.constants"
import type { TaxonomyItem } from "@/shared/types/global.types"

interface BrandStripProps {
  brands: TaxonomyItem[]
}

export const BrandStrip = ({ brands }: BrandStripProps) => {
  const items = Object.keys(BRAND_PAGES)
    .filter(
      (customId) =>
        BRAND_PAGE_HREFS[customId] !== undefined &&
        brands.some((brand) => brand.customId === customId),
    )
    .map((customId) => {
      const liveBrand = brands.find((brand) => brand.customId === customId)
      return {
        customId,
        href: BRAND_PAGE_HREFS[customId],
        label: getBrandDisplayName(customId) ?? liveBrand?.name ?? customId,
      }
    })

  if (items.length === 0) {
    return null
  }

  return (
    <nav
      aria-label="Marcas en almacén"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm"
    >
      <span className="text-xs font-semibold tracking-wide uppercase text-muted">
        Marcas en almacén
      </span>
      {items.map((item, index) => (
        <span key={item.customId} className="flex items-center gap-3">
          <Link
            href={item.href}
            className="font-medium hover:text-[#125D03] dark:hover:text-[#4DF527]"
          >
            {item.label}
          </Link>
          {index < items.length - 1 && <span aria-hidden="true">·</span>}
        </span>
      ))}
      <Link href="/marcas" className="ml-auto inline-flex items-center gap-1">
        Explorar el catálogo por marca
        <RiArrowRightLine aria-hidden="true" size={16} />
      </Link>
    </nav>
  )
}
