import Link from "next/link"
import { RiArrowRightLine } from "@remixicon/react"

import { BRAND_PAGE_HREFS } from "@/shared/constants/brand.constants"
import type { BrandPageConfig } from "@/shared/constants/brand.constants"

export type BrandCardItem = BrandPageConfig & { customId: string }

export const BrandCard = ({ brand }: { brand: BrandCardItem }) => {
  const href = BRAND_PAGE_HREFS[brand.customId]

  return (
    <article className="flex flex-col gap-3.5 rounded-[14px] border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_8px_24px_rgba(17,24,39,.08)] dark:border-[#1E3608] dark:bg-[#0B1A02] dark:hover:border-[#244310] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,.6)]">
      <div
        className="flex h-24 items-center justify-center overflow-hidden rounded-[10px] border border-gray-200 p-2.5 dark:border-[#1E3608]"
        style={{ backgroundColor: brand.logo.background }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- D8: plain <img>, Cloudinary already serves sized WebP */}
        <img
          src={brand.logo.src}
          width={brand.logo.width}
          height={brand.logo.height}
          alt={brand.name}
          loading="lazy"
          className="h-auto max-h-full w-auto max-w-full object-contain"
        />
      </div>
      <div className="flex flex-col gap-[5px]">
        <h3 className="text-[22px] leading-[1.15] font-extrabold tracking-[-0.01em] text-gray-900 dark:text-white">
          {brand.name}
        </h3>
        <p className="text-[12.5px] text-gray-500 dark:text-gray-400">{brand.origin}</p>
      </div>
      <p className="text-[14.5px] leading-[1.5] text-gray-700 dark:text-gray-300">
        {brand.identity}
      </p>
      <div className="flex flex-col gap-[5px]">
        <p className="text-[11px] font-semibold tracking-[0.06em] text-[#23890C] uppercase dark:text-[#4DF527]">
          En almacén
        </p>
        <p className="text-[13px] leading-[1.55] text-gray-600 dark:text-gray-400">
          {brand.stock}
        </p>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {brand.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full border border-gray-200 px-[9px] py-[3px] text-[11px] text-gray-700 dark:border-[#1E3608] dark:text-gray-300"
          >
            {tag}
          </li>
        ))}
      </ul>
      {href !== undefined ? (
        <Link
          href={href}
          className="mt-auto flex min-h-11 w-full items-center justify-center gap-1 rounded-[10px] bg-[#4DF527] text-[14.5px] font-semibold text-[#0D3401] hover:bg-[#3BD11A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24AD02]"
        >
          Ver productos
          <RiArrowRightLine aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="mt-auto flex min-h-11 w-full items-center justify-center gap-1 rounded-[10px] bg-gray-100 text-[14.5px] font-semibold text-gray-500 dark:bg-[#12250A] dark:text-gray-400"
        >
          Ver productos
          <RiArrowRightLine aria-hidden="true" className="size-4" />
        </span>
      )}
    </article>
  )
}
