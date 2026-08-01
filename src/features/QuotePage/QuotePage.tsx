"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AlertDialog, Button, toast, useOverlayState } from "@heroui/react"

import { useCartStore } from "@/zustand/provider/cart.provider"
import { cartLineKey } from "@/zustand/store/cart.store"
import { formatNumberToCurrency } from "@/shared/utils/global.utils"
import { ProductVariantsDrawer } from "@/features/ProductVariantsDrawer/ProductVariantsDrawer"
import type {
  CartVariantLine,
  Product,
  ProductVariantUI,
} from "@/shared/types/global.types"
import { QuoteLineRow } from "./QuoteLineRow"
import { getQuoteTotals } from "./quote.utils"

interface QuoteHeadingProps {
  counts?: { productCount: number; pieceCount: number }
}

const QuoteHeading = ({ counts }: QuoteHeadingProps) => (
  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-2xl font-bold">Solicitar cotización</h1>
      <p className="text-muted">Revisa productos, medidas y cantidades.</p>
    </div>
    {counts && (
      <span className="text-sm text-muted">
        {counts.productCount} producto{counts.productCount === 1 ? "" : "s"} ·{" "}
        {counts.pieceCount} pieza{counts.pieceCount === 1 ? "" : "s"}
      </span>
    )}
  </div>
)

export const QuotePage = () => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const lines = useCartStore((store) => store.lines)
  const setLineQuantity = useCartStore((store) => store.setLineQuantity)
  const removeLine = useCartStore((store) => store.removeLine)
  const clearLines = useCartStore((store) => store.clearLines)
  const upgradeLine = useCartStore((store) => store.upgradeLine)

  const listRegionRef = useRef<HTMLDivElement>(null)
  const shouldFocusRegionRef = useRef(false)
  const [focusRequestId, setFocusRequestId] = useState(0)

  // ponytail: one region-level focus target; per-row neighbour focus if QA says the jump is disorienting
  useEffect(() => {
    if (shouldFocusRegionRef.current) {
      listRegionRef.current?.focus()
      shouldFocusRegionRef.current = false
    }
  }, [focusRequestId])

  const requestRegionFocus = () => {
    shouldFocusRegionRef.current = true
    setFocusRequestId((id) => id + 1)
  }

  const [upgradeKey, setUpgradeKey] = useState<string | null>(null)
  const upgradeState = useOverlayState({
    onOpenChange: (isOpen) => {
      if (!isOpen) {
        setUpgradeKey(null)
      }
    },
  })
  const upgradeTargetLine = lines.find(
    (line) => cartLineKey(line) === upgradeKey,
  )
  const upgradeProduct: Product | null = upgradeTargetLine
    ? {
        documentId: upgradeTargetLine.productDocumentId,
        name: upgradeTargetLine.productName,
        category: null,
        brand: null,
      }
    : null

  const { subtotal, productCount, pieceCount } = getQuoteTotals(lines)
  const formattedSubtotal = formatNumberToCurrency(subtotal)

  const handleRemove = (key: string) => {
    requestRegionFocus()
    removeLine(key)
  }

  const handleChooseVariant = (key: string) => {
    setUpgradeKey(key)
    upgradeState.open()
  }

  const handleUpgradeConfirm = (variant: ProductVariantUI, quantity: number) => {
    if (!upgradeKey || !upgradeTargetLine) {
      return
    }
    const next: CartVariantLine = {
      productDocumentId: upgradeTargetLine.productDocumentId,
      productName: upgradeTargetLine.productName,
      variantDocumentId: variant.documentId,
      internalId: variant.internalId,
      diameter: variant.diameter,
      unitPrice: variant.price,
      quantity,
    }
    const result = upgradeLine(upgradeKey, next)

    if (result === "upgraded") {
      toast.success(`Medida elegida: ${variant.diameter}`)
      requestRegionFocus()
    } else if (result === "merged") {
      toast.success(
        `Medida elegida: ${variant.diameter}. Se combinó con la línea que ya tenías.`,
      )
      requestRegionFocus()
    }
  }

  if (!mounted) {
    return (
      <>
        <QuoteHeading />
        <div
          aria-hidden="true"
          className="h-40 animate-pulse rounded-lg border border-default-200 bg-default-50"
        />
      </>
    )
  }

  if (lines.length === 0) {
    return (
      <>
        <QuoteHeading />
        <div
          ref={listRegionRef}
          tabIndex={-1}
          className="flex flex-col items-center gap-4 rounded-lg border border-default-200 p-10 text-center"
        >
          <p className="text-lg font-medium">Tu lista está vacía</p>
          <Link
            href="/"
            className="text-sm font-medium text-emerald-700 underline dark:text-emerald-400"
          >
            Volver al catálogo
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <QuoteHeading counts={{ productCount, pieceCount }} />
      <p role="status" className="sr-only">
        {`${productCount} productos · ${pieceCount} piezas. Subtotal ${formattedSubtotal}`}
      </p>
      <div ref={listRegionRef} tabIndex={-1}>
        <ul className="flex flex-col gap-3">
          {lines.map((line) => {
            const key = cartLineKey(line)
            return (
              <QuoteLineRow
                key={key}
                line={line}
                onQuantityChange={(quantity) => setLineQuantity(key, quantity)}
                onRemove={() => handleRemove(key)}
                onChooseVariant={() => handleChooseVariant(key)}
              />
            )
          })}
        </ul>
      </div>
      <div className="flex flex-col gap-4 border-t border-default-200 pt-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold">Subtotal estimado (líneas con precio)</p>
          <p className="text-sm text-muted">
            Precios de referencia. El vendedor confirma disponibilidad y precio
            final.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-sm text-muted">
            {productCount} producto{productCount === 1 ? "" : "s"} ·{" "}
            {pieceCount} pieza{pieceCount === 1 ? "" : "s"}
          </span>
          <span className="text-xl font-bold">{formattedSubtotal}</span>
        </div>
      </div>
      <AlertDialog>
        <AlertDialog.Trigger>
          <Button variant="danger">Vaciar lista</Button>
        </AlertDialog.Trigger>
        <AlertDialog.Backdrop isKeyboardDismissDisabled={false}>
          <AlertDialog.Container placement="center">
            <AlertDialog.Dialog>
              {({ close }) => (
                <>
                  <AlertDialog.Header>
                    <AlertDialog.Heading>¿Vaciar la lista?</AlertDialog.Heading>
                  </AlertDialog.Header>
                  <AlertDialog.Body>
                    Se quitarán los {productCount} productos de tu lista. No se
                    puede deshacer.
                  </AlertDialog.Body>
                  <AlertDialog.Footer>
                    <Button variant="secondary" autoFocus onPress={close}>
                      Cancelar
                    </Button>
                    <Button
                      variant="danger"
                      onPress={() => {
                        clearLines()
                        close()
                      }}
                    >
                      Vaciar lista
                    </Button>
                  </AlertDialog.Footer>
                </>
              )}
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
      {upgradeProduct && (
        <ProductVariantsDrawer
          product={upgradeProduct}
          state={upgradeState}
          initialQuantity={upgradeTargetLine?.quantity}
          onConfirmVariant={handleUpgradeConfirm}
        />
      )}
    </>
  )
}
