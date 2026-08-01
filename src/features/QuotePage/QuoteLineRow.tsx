"use client"

import { Button } from "@heroui/react"
import { RiInformationLine } from "@remixicon/react"

import type { CartLine } from "@/shared/types/global.types"
import { formatNumberToCurrency } from "@/shared/utils/global.utils"
import { QuantityStepper } from "@/shared/ui/atoms/QuantityStepper"

interface QuoteLineRowProps {
  line: CartLine
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
  onChooseVariant: () => void
}

export const QuoteLineRow = ({
  line,
  onQuantityChange,
  onRemove,
  onChooseVariant,
}: QuoteLineRowProps) => {
  const lineLabel =
    line.variantDocumentId === null
      ? line.productName
      : `${line.productName}, ${line.diameter}`

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
              Sin variante seleccionada
            </p>
          </div>
          <Button
            variant="tertiary"
            aria-label={`Quitar ${lineLabel}`}
            onPress={onRemove}
          >
            Quitar
          </Button>
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
        <Button
          variant="tertiary"
          aria-label={`Quitar ${lineLabel}`}
          onPress={onRemove}
        >
          Quitar
        </Button>
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
          <p className="font-medium">{formatNumberToCurrency(line.unitPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase">Total</p>
          <p className="font-medium">
            {formatNumberToCurrency(line.unitPrice * line.quantity)}
          </p>
        </div>
      </div>
    </li>
  )
}
