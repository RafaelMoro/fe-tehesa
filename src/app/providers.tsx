// app/providers.tsx
"use client"

import { Toast } from "@heroui/react"

import { CartStoreProvider } from "@/zustand/provider/cart.provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartStoreProvider>
      {children}
      <Toast.Provider placement="bottom end" maxVisibleToasts={1} className="z-[60]" />
    </CartStoreProvider>
  )
}
