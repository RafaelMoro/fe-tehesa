"use client"

import { useContext, useEffect, useRef, type ReactNode } from "react"
import { useStore } from "zustand"

import {
  CartStoreContext,
  createCartStore,
  type CartLine,
  type CartStore,
  type CartStoreApi,
} from "../store/cart.store"

const CART_STORAGE_KEY = "tehesa-cart"

const isCartLine = (value: unknown): value is CartLine => {
  if (!value || typeof value !== "object") {
    return false
  }

  const line = value as Partial<CartLine>
  return (
    typeof line.id === "string" &&
    typeof line.productId === "string" &&
    typeof line.name === "string" &&
    typeof line.brand === "string" &&
    typeof line.sku === "string" &&
    typeof line.variant === "string" &&
    (line.fulfillment === "shipping" ||
      line.fulfillment === "pickup" ||
      line.fulfillment === "same-day") &&
    typeof line.listPrice === "number" &&
    Number.isFinite(line.listPrice) &&
    line.listPrice >= 0 &&
    typeof line.unitPrice === "number" &&
    Number.isFinite(line.unitPrice) &&
    line.unitPrice >= 0 &&
    typeof line.quantity === "number" &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0
  )
}

export const CartStoreProvider = ({ children }: { children: ReactNode }) => {
  const storeRef = useRef<CartStoreApi | null>(null)

  if (storeRef.current === null) {
    storeRef.current = createCartStore()
  }

  useEffect(() => {
    const store = storeRef.current
    if (!store) {
      return
    }

    try {
      const storedCart = window.localStorage.getItem(CART_STORAGE_KEY)
      const parsedCart: unknown = storedCart ? JSON.parse(storedCart) : []

      if (Array.isArray(parsedCart)) {
        store.getState().hydrate(parsedCart.filter(isCartLine))
      }
    } catch {
      try {
        window.localStorage.removeItem(CART_STORAGE_KEY)
      } catch {
        // The in-memory cart remains available when storage is blocked.
      }
    }

    return store.subscribe((state) => {
      try {
        window.localStorage.setItem(
          CART_STORAGE_KEY,
          JSON.stringify(state.lines),
        )
      } catch {
        // Storage can be unavailable in privacy modes; cart state still works.
      }
    })
  }, [])

  return (
    <CartStoreContext.Provider value={storeRef.current}>
      {children}
    </CartStoreContext.Provider>
  )
}

export const useCartStore = <T,>(selector: (store: CartStore) => T): T => {
  const cartStore = useContext(CartStoreContext)

  if (!cartStore) {
    throw new Error("useCartStore must be used within CartStoreProvider")
  }

  return useStore(cartStore, selector)
}
