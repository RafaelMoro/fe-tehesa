"use client"

import { CartStoreProvider } from "@/zustand/provider/cart.provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return <CartStoreProvider>{children}</CartStoreProvider>
}
