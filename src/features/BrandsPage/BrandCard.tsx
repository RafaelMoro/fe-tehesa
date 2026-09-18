import Link from "next/link"
import { RiArrowRightLine } from "@remixicon/react"

import { BRAND_PAGE_HREFS } from "@/shared/constants/brand.constants"
import type { BrandPageConfig } from "@/shared/constants/brand.constants"

export type BrandCardItem = BrandPageConfig & { customId: string }

export const BrandCard = ({ brand }: { brand: BrandCardItem }) => {
  const href = BRAND_PAGE_HREFS[brand.customId]

  return (
    <article className="flex flex-col gap-3 rounded-[14px] border border-default-200 p-5 transition hover:-translate-y-0.5 hover:border-default-400 hover:shadow-md dark:border-[#1E3608] dark:hover:border-[#2E5210]">
      <h2 className="text-lg font-bold">{brand.name}</h2>
      <p className="text-sm text-muted">{brand.origin}</p>
      <p>{brand.identity}</p>
      <p className="text-xs font-semibold text-[#23890C] dark:text-[#4DF527]">
        En almacén
      </p>
      <p className="text-sm text-muted">{brand.stock}</p>
      <ul className="flex flex-wrap gap-1.5">
        {brand.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full border border-default-200 px-2 py-0.5 text-[11px] dark:border-[#1E3608]"
          >
            {tag}
          </li>
        ))}
      </ul>
      {href !== undefined ? (
        <Link
          href={href}
          className="mt-auto flex min-h-11 w-full items-center justify-center gap-1 rounded-lg bg-[#4DF527] font-semibold text-[#0D3401] hover:bg-[#3BD11A]"
        >
          Ver productos
          <RiArrowRightLine aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="mt-auto flex min-h-11 w-full items-center justify-center gap-1 rounded-lg bg-default-100 font-semibold text-muted dark:bg-[#12250A]"
        >
          Ver productos
          <RiArrowRightLine aria-hidden="true" className="size-4" />
        </span>
      )}
    </article>
  )
}
