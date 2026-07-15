import { createContext } from "react"
import { createStore } from "zustand/vanilla"

import { getDiscountedUnitPrice } from "@/shared/utils/pricing.utils"

export type FulfillmentMethod = "shipping" | "pickup" | "same-day"

export type CartLine = {
  id: string
  productId: string
  name: string
  brand: string
  sku: string
  variant: string
  fulfillment: FulfillmentMethod
  listPrice: number
  unitPrice: number
  quantity: number
}

export type CartState = {
  lines: CartLine[]
}

export type CartActions = {
  addItem: (item: CartLine) => void
  removeItem: (id: string) => void
  clearCart: () => void
  hydrate: (lines: CartLine[]) => void
}

export type CartStore = CartState & CartActions

export const createCartStore = () =>
  createStore<CartStore>()((set) => ({
    lines: [],
    addItem: (item) =>
      set((state) => {
        const existing = state.lines.find((line) => line.id === item.id)

        if (!existing) {
          return {
            lines: [
              ...state.lines,
              {
                ...item,
                unitPrice: getDiscountedUnitPrice(
                  item.listPrice,
                  item.quantity,
                ),
              },
            ],
          }
        }

        const nextQuantity = existing.quantity + item.quantity

        return {
          lines: state.lines.map((line) =>
            line.id === item.id
              ? {
                  ...line,
                  listPrice: item.listPrice,
                  unitPrice: getDiscountedUnitPrice(
                    item.listPrice,
                    nextQuantity,
                  ),
                  quantity: nextQuantity,
                }
              : line,
          ),
        }
      }),
    removeItem: (id) =>
      set((state) => ({
        lines: state.lines.filter((line) => line.id !== id),
      })),
    clearCart: () => set({ lines: [] }),
    hydrate: (lines) => set({ lines }),
  }))

export type CartStoreApi = ReturnType<typeof createCartStore>

export const CartStoreContext = createContext<CartStoreApi | undefined>(
  undefined,
)
