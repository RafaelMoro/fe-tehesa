"use client"

import { useEffect, useState } from "react"
import { RiShoppingCart2Line } from "@remixicon/react"

import { useCartStore } from "@/zustand/provider/cart.provider"

export const CartCount = () => {
  const [mounted, setMounted] = useState(false)
  const lineCount = useCartStore((store) => store.lines.length)

  useEffect(() => {
    setMounted(true)
  }, [])

  const count = mounted ? lineCount : 0
  const countLabel = count > 99 ? "99+" : String(count)

  return (
    <div className="relative flex size-11 items-center justify-center">
      <RiShoppingCart2Line aria-hidden="true" className="size-6" />
      <span
        aria-hidden="true"
        className={`absolute right-0 bottom-0 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
          count === 0
            ? "border border-default-200 bg-default-100 text-muted"
            : "bg-emerald-700 text-white dark:bg-emerald-400 dark:text-emerald-950"
        }`}
      >
        {countLabel}
      </span>
      <span className="sr-only">
        Mi lista, {count} artículo{count === 1 ? "" : "s"}
      </span>
    </div>
  )
}
