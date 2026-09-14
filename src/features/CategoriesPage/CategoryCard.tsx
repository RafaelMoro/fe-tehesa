import { RiArrowRightLine } from "@remixicon/react"

import type { CategoryWithCount } from "@/shared/types/global.types"

const countFormatter = new Intl.NumberFormat("es-MX")

export const CategoryCard = ({ category }: { category: CategoryWithCount }) => {
  return (
    <article className="flex flex-col gap-3 rounded-[14px] border border-default-200 p-5 transition hover:border-default-400 hover:shadow-md dark:border-[#1E3608] dark:hover:border-[#2E5210]">
      <div className="flex items-center justify-between">
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-full bg-[#F5FFEF] font-semibold text-[#125D03] dark:bg-[#12250A] dark:text-[#4DF527]"
        >
          {category.name.charAt(0).toUpperCase()}
        </span>
        {category.productCount !== null && (
          <span className="rounded-full bg-default-100 px-3 py-1 text-xs font-medium dark:bg-[#12250A]">
            {countFormatter.format(category.productCount)} productos
          </span>
        )}
      </div>
      <h2 className="text-lg font-semibold [text-wrap:pretty]">{category.name}</h2>
      <span
        aria-disabled="true"
        className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-muted"
      >
        Ver categoría
        <RiArrowRightLine aria-hidden="true" className="size-4" />
      </span>
    </article>
  )
}
