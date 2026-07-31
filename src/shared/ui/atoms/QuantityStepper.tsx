"use client"

import { NumberField } from "@heroui/react"

import {
  CART_MAX_QUANTITY,
  CART_MIN_QUANTITY,
} from "@/shared/constants/cart.constants"

interface QuantityStepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  minValue?: number
  maxValue?: number
}

export const QuantityStepper = ({
  label,
  value,
  onChange,
  minValue = CART_MIN_QUANTITY,
  maxValue = CART_MAX_QUANTITY,
}: QuantityStepperProps) => {
  return (
    <NumberField.Root
      aria-label={label}
      value={value}
      onChange={(next) => {
        if (Number.isNaN(next)) {
          console.warn(
            `QuantityStepper: ignored NaN onChange for "${label}" (input cleared)`,
          )
          return
        }
        onChange(next)
      }}
      minValue={minValue}
      maxValue={maxValue}
      step={1}
      formatOptions={{ maximumFractionDigits: 0 }}
    >
      <NumberField.Group>
        <NumberField.DecrementButton aria-label={`Disminuir ${label}`} />
        <NumberField.Input />
        <NumberField.IncrementButton aria-label={`Aumentar ${label}`} />
      </NumberField.Group>
    </NumberField.Root>
  )
}
