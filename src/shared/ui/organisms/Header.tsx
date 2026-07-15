"use client"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button, Popover } from "@heroui/react"
import {
  RiDeleteBin6Line,
  RiShoppingCart2Line,
  RiTruckLine,
} from "@remixicon/react"

import { ToggleDarkMode } from "../atoms/ToggleDarkMode"
import { useTheme } from "next-themes"
import type { AppTheme } from "@/shared/types/global.types"
import { formatNumberToCurrency } from "@/shared/utils/global.utils"
import { useCartStore } from "@/zustand/provider/cart.provider"
import type { FulfillmentMethod } from "@/zustand/store/cart.store"

const FULFILLMENT_LABELS: Record<FulfillmentMethod, string> = {
  shipping: "Paquetería nacional",
  pickup: "Recoger en sucursal",
  "same-day": "Entrega local hoy",
}

interface HeaderProps {
  themeFetched: AppTheme
}

export const Header = ({ themeFetched }: HeaderProps) => {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const lines = useCartStore((store) => store.lines)
  const removeItem = useCartStore((store) => store.removeItem)
  const clearCart = useCartStore((store) => store.clearCart)

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoTheme = mounted ? theme : themeFetched
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0)
  const subtotal = lines.reduce(
    (total, line) => total + line.unitPrice * line.quantity,
    0,
  )

  return (
    <header className="sticky top-0 z-40 border-b border-black/8 bg-white/92 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-5">
          <Link
            className="shrink-0"
            href="/"
            aria-label="Ir al catálogo Tehesa"
          >
            <Image
              alt="Tehesa Logo"
              height={61}
              width={115}
              className="h-auto w-[98px] rounded-sm sm:w-[115px]"
              src={
                logoTheme === "dark"
                  ? "/tehesa-logo-negativo.webp"
                  : "/tehesa-logo.webp"
              }
              priority
            />
          </Link>
          <div className="hidden items-center gap-2 border-l border-default-200 pl-5 text-xs text-muted lg:flex">
            <RiTruckLine aria-hidden="true" size={17} />
            <span>Envíos a todo México · Facturación disponible</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <Button
              variant="tertiary"
              aria-label={`Carrito, ${itemCount} ${itemCount === 1 ? "producto" : "productos"}`}
              className="relative"
            >
              <RiShoppingCart2Line aria-hidden="true" size={20} />
              <span className="hidden sm:inline">Carrito</span>
              {itemCount > 0 && (
                <span className="flex min-w-5 items-center justify-center rounded-full bg-primary-200 px-1.5 py-0.5 text-[11px] font-black text-primary-950">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Button>
            <Popover.Content className="w-[min(92vw,390px)] p-0">
              <Popover.Dialog>
                <div className="border-b border-default-200 px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-bold">Tu pedido</h2>
                    {lines.length > 0 && (
                      <Button size="sm" variant="tertiary" onPress={clearCart}>
                        Vaciar
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {itemCount} {itemCount === 1 ? "pieza" : "piezas"} en el
                    carrito
                  </p>
                </div>
                {lines.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-default-100">
                      <RiShoppingCart2Line aria-hidden="true" />
                    </div>
                    <p className="mt-3 font-semibold">Tu carrito está vacío</p>
                    <p className="mt-1 text-sm text-muted">
                      Elige una medida para comenzar tu pedido.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-72 divide-y divide-default-100 overflow-y-auto">
                      {lines.map((line) => (
                        <div
                          className="grid grid-cols-[1fr_auto] gap-3 px-5 py-4"
                          key={line.id}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {line.name}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              {line.variant} · {line.quantity} pzas.
                            </p>
                            <p className="mt-0.5 text-[10px] font-semibold text-primary-700 dark:text-primary-200">
                              {FULFILLMENT_LABELS[line.fulfillment]}
                            </p>
                            <p className="mt-1 text-sm font-bold tabular-nums">
                              {formatNumberToCurrency(
                                line.unitPrice * line.quantity,
                              )}
                            </p>
                          </div>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="tertiary"
                            aria-label={`Quitar ${line.name}, ${FULFILLMENT_LABELS[line.fulfillment]}`}
                            onPress={() => removeItem(line.id)}
                          >
                            <RiDeleteBin6Line aria-hidden="true" size={17} />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-default-200 bg-default-50 px-5 py-4 dark:bg-default-100/40">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted">Subtotal</span>
                        <span className="text-lg font-black tabular-nums">
                          {formatNumberToCurrency(subtotal)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted">
                        Impuestos y envío se calculan al confirmar.
                      </p>
                    </div>
                  </>
                )}
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
          <ToggleDarkMode />
        </div>
      </div>
    </header>
  )
}
