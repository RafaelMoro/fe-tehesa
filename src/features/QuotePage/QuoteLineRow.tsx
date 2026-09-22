"use client"

import Link from "next/link"
import { Button } from "@heroui/react"
import { RiCheckLine, RiInformationLine } from "@remixicon/react"

import type { CartLine } from "@/shared/types/global.types"
import { formatNumberToCurrency } from "@/shared/utils/global.utils"
import { QuantityStepper } from "@/shared/ui/atoms/QuantityStepper"
import { buildProductSearchHref, type LineCheck } from "./quote.utils"
import type { QuotePageStatus } from "./useQuoteRevalidation"

interface QuoteLineRowProps {
  line: CartLine
  check?: LineCheck
  pageStatus: QuotePageStatus
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
  onChooseVariant: () => void
}

export const QuoteLineRow = ({
  line,
  check,
  pageStatus,
  onQuantityChange,
  onRemove,
  onChooseVariant,
}: QuoteLineRowProps) => {
  const lineLabel =
    line.variantDocumentId === null
      ? line.productName
      : `${line.productName}, ${line.diameter}`

  const removeButton = (
    <Button
      variant="tertiary"
      aria-label={`Quitar ${lineLabel}`}
      onPress={onRemove}
    >
      Quitar
    </Button>
  )

  if (check?.kind === "product-gone") {
    const href = buildProductSearchHref(line.productName)
    return (
      <li
        aria-label={lineLabel}
        className="flex flex-col gap-3 rounded-lg border border-default-200 p-4 text-muted"
      >
        <p className="font-bold text-foreground">{line.productName}</p>
        <p className="text-sm">
          Este producto ya no está disponible.{" "}
          <span>Esta línea no se incluye en el subtotal.</span>
        </p>
        <div className="flex flex-wrap gap-3">
          {href && (
            <Link
              href={href}
              aria-label={`Buscar alternativa para ${lineLabel}`}
              className="button button--md button--secondary"
            >
              Buscar alternativa
            </Link>
          )}
          {removeButton}
        </div>
      </li>
    )
  }

  if (check?.kind === "variant-gone" && line.variantDocumentId !== null) {
    return (
      <li
        aria-label={lineLabel}
        className="flex flex-col gap-3 rounded-lg border border-default-200 p-4 text-muted"
      >
        <p className="font-bold text-foreground">{line.productName}</p>
        <p className="text-sm">
          La medida {line.diameter} ya no está disponible.{" "}
          <span>Esta línea no se incluye en el subtotal.</span>
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            aria-label={`Elegir otra medida de ${lineLabel}`}
            onPress={onChooseVariant}
          >
            Elegir otra medida
          </Button>
          {removeButton}
        </div>
      </li>
    )
  }

  if (check?.kind === "no-price" && line.variantDocumentId !== null) {
    return (
      <li
        aria-label={lineLabel}
        className="flex flex-col gap-3 rounded-lg border border-default-200 p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold">{line.productName}</p>
            <p className="mt-1 text-sm text-muted">{line.diameter}</p>
          </div>
          {removeButton}
        </div>
        <QuantityStepper
          label={`Cantidad de ${lineLabel}`}
          value={line.quantity}
          onChange={onQuantityChange}
        />
        <div>
          <p className="font-medium">Esta medida no tiene precio actual.</p>
          <p className="text-sm text-muted">
            Te confirmaremos el precio al responder tu solicitud. Si no está
            disponible, buscaremos una alternativa.
          </p>
          <p className="text-sm text-muted">
            Esta línea no se incluye en el subtotal.
          </p>
        </div>
      </li>
    )
  }

  if (line.variantDocumentId === null) {
    return (
      <li
        aria-label={lineLabel}
        className="flex flex-col gap-3 rounded-lg border border-emerald-700 bg-emerald-50 p-4 dark:bg-emerald-950/20"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold">{line.productName}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted">
              <RiInformationLine aria-hidden="true" className="size-4 shrink-0" />
              Sin medida seleccionada
            </p>
          </div>
          {removeButton}
        </div>
        <QuantityStepper
          label={`Cantidad de ${lineLabel}`}
          value={line.quantity}
          onChange={onQuantityChange}
        />
        <div>
          <p className="font-medium">Sin precio por ahora</p>
          <p className="text-sm text-muted">El precio depende de la medida.</p>
        </div>
        <Button
          variant="primary"
          aria-label={`Elegir medida de ${lineLabel}`}
          onPress={onChooseVariant}
        >
          Elegir medida
        </Button>
      </li>
    )
  }

  const currentPrice = check?.kind === "priced" ? check.currentPrice : line.unitPrice
  const changed =
    check?.kind === "priced" &&
    Math.round(check.currentPrice * 100) !== Math.round(line.unitPrice * 100)

  const priceAffix = check
    ? "precio comprobado"
    : pageStatus === "failed"
      ? "precio sin confirmar"
      : "precio guardado"

  return (
    <li
      aria-label={lineLabel}
      className="flex flex-col gap-3 rounded-lg border border-default-200 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">{line.productName}</p>
          <p className="mt-1 text-sm text-muted">
            {line.diameter} · {priceAffix}
          </p>
          {changed && (
            <p className="mt-1 flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-400">
              <RiCheckLine aria-hidden="true" className="size-4 shrink-0" />
              El precio cambió al comprobar la lista.
            </p>
          )}
        </div>
        {removeButton}
      </div>
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="text-xs text-muted uppercase">Cantidad</p>
          <QuantityStepper
            label={`Cantidad de ${lineLabel}`}
            value={line.quantity}
            onChange={onQuantityChange}
          />
        </div>
        <div>
          <p className="text-xs text-muted uppercase">Precio unitario</p>
          {changed && (
            <p className="text-sm text-muted line-through">
              <span className="sr-only">Precio anterior: </span>
              {formatNumberToCurrency(line.unitPrice)}
            </p>
          )}
          <p className="font-medium">{formatNumberToCurrency(currentPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase">
            {changed ? "Total actual" : "Total"}
          </p>
          <p className="font-medium">
            {formatNumberToCurrency(currentPrice * line.quantity)}
          </p>
        </div>
      </div>
    </li>
  )
}
