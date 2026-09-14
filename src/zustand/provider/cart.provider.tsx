"use client"

import { ReactNode, useRef, useContext } from "react"
import { useStore } from "zustand"

import {
  createCartStore,
  CartStoreApi,
  CartStoreContext,
  type CartStore,
} from "../store/cart.store"

interface CartStoreProviderProps {
  children: ReactNode
}

export const CartStoreProvider = ({ children }: CartStoreProviderProps) => {
  const storeRef = useRef<CartStoreApi | null>(null)
  if (storeRef.current === null) {
    storeRef.current = createCartStore()
  }

  return (
    <CartStoreContext.Provider value={storeRef.current}>
      {children}
    </CartStoreContext.Provider>
  )
}

export const useCartStore = <T,>(selector: (store: CartStore) => T): T => {
  const cartStoreContext = useContext(CartStoreContext)

  if (!cartStoreContext) {
    throw new Error(`useCartStore must be used within CartStoreContext`)
  }

  return useStore(cartStoreContext, selector)
}
